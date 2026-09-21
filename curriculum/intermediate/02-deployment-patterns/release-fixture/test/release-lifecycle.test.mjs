import assert from "node:assert/strict";
import test from "node:test";
import {
  BASELINE_DIGEST,
  applyDeployment,
  authorizeOidcClaims,
  createEnvironmentState,
  createOidcTrustContract,
  createRelease,
  evaluateHealth,
  reconcileDeployment,
  rollbackDeployment,
  verifyRelease,
} from "../src/release-lifecycle.mjs";

const source = { service: "northstar-checkout", runtime: "nodejs24", features: ["b", "a"] };
const identity = { version: "v1.2.3", commit: "abcdef0123456789abcdef0123456789abcdef01" };
const release = createRelease(source, identity);
const request = {
  environment: "lab-production",
  idempotencyKey: `deploy:${identity.version}:${identity.commit}`,
  digest: release.manifest.digest,
};

test("release output is deterministic and binds version to commit", () => {
  const second = createRelease(source, identity);
  assert.equal(second.artifactText, release.artifactText);
  assert.equal(second.manifest.digest, release.manifest.digest);
});

test("verification accepts the exact artifact identity", () => {
  const result = verifyRelease(release.artifactText, release.manifest, identity);
  assert.equal(result.digest, release.manifest.digest);
});

test("verification rejects tampering", () => {
  assert.throws(() => verifyRelease(`${release.artifactText} `, release.manifest), /digest mismatch/);
});

test("deployment applies once and records the previous digest", () => {
  const initial = createEnvironmentState("lab-production");
  const result = applyDeployment(initial, request);
  assert.equal(result.outcome, "applied");
  assert.equal(result.state.currentDigest, request.digest);
  assert.equal(result.state.previousDigest, BASELINE_DIGEST);
});

test("the same idempotency key and digest are safe to replay", () => {
  const applied = applyDeployment(createEnvironmentState("lab-production"), request);
  const replay = applyDeployment(applied.state, request);
  assert.equal(replay.outcome, "already-applied");
  assert.equal(replay.wrote, false);
});

test("an idempotency key cannot name a different artifact", () => {
  const applied = applyDeployment(createEnvironmentState("lab-production"), request);
  assert.throws(
    () => applyDeployment(applied.state, { ...request, digest: `sha256:${"f".repeat(64)}` }),
    /reused/,
  );
});

test("failure before write is safe to retry after reconciliation", () => {
  const initial = createEnvironmentState("lab-production");
  const failed = applyDeployment(initial, request, "before-write");
  assert.equal(reconcileDeployment(failed.state, request).safeToRetry, true);
});

test("failure after write must reconcile instead of retrying blindly", () => {
  const uncertain = applyDeployment(createEnvironmentState("lab-production"), request, "after-write");
  assert.equal(uncertain.outcome, "uncertain-after-write");
  assert.deepEqual(reconcileDeployment(uncertain.state, request), {
    resolution: "applied",
    safeToRetry: false,
  });
});

test("healthy canary signals pass policy", () => {
  assert.equal(evaluateHealth({ requests: 500, errorRate: 0.005, p95LatencyMs: 220 }).pass, true);
});

test("unhealthy and undersized canary signals explain failures", () => {
  const result = evaluateHealth({ requests: 20, errorRate: 0.05, p95LatencyMs: 900 });
  assert.equal(result.pass, false);
  assert.equal(result.failures.length, 3);
});

test("rollback uses compare-and-swap and restores the previous digest", () => {
  const applied = applyDeployment(createEnvironmentState("lab-production"), request);
  const rolledBack = rollbackDeployment(applied.state, request.digest, "health regression");
  assert.equal(rolledBack.currentDigest, BASELINE_DIGEST);
  assert.throws(
    () => rollbackDeployment(applied.state, BASELINE_DIGEST, "stale operator"),
    /compare-and-swap/,
  );
});

test("OIDC trust requires immutable repository identity, environment, and workflow", () => {
  const contract = createOidcTrustContract({
    repositoryId: "123",
    repositoryOwnerId: "456",
    environment: "lab-production",
    jobWorkflowRef: "oneplusi/platform/.github/workflows/deploy.yml@refs/heads/main",
    audience: "https://cloud.example.com",
  });
  const claims = {
    iss: contract.issuer,
    aud: contract.audience,
    repository_id: "123",
    repository_owner_id: "456",
    environment: "lab-production",
    job_workflow_ref: "oneplusi/platform/.github/workflows/deploy.yml@refs/heads/main",
  };
  assert.equal(authorizeOidcClaims(claims, contract), true);
  assert.equal(authorizeOidcClaims({ ...claims, environment: "staging" }, contract), false);
});
