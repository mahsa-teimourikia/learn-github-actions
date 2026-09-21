import { createHash } from "node:crypto";

export const BASELINE_DIGEST = `sha256:${"0".repeat(64)}`;

export function sha256(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

export function createRelease(source, { version, commit }) {
  if (!/^v\d+\.\d+\.\d+$/.test(version)) throw new Error("version must use vMAJOR.MINOR.PATCH");
  if (!/^[0-9a-f]{7,64}$/i.test(commit)) throw new Error("commit must be a Git hexadecimal identifier");
  if (!source?.service || !Array.isArray(source.features)) throw new Error("invalid release source");

  const artifact = {
    schemaVersion: 1,
    service: source.service,
    runtime: source.runtime,
    features: [...source.features].sort(),
    version,
    commit,
  };
  const artifactText = `${JSON.stringify(artifact, null, 2)}\n`;
  const manifest = {
    schemaVersion: 1,
    artifact: "northstar-release.json",
    algorithm: "sha256",
    digest: sha256(artifactText),
    version,
    commit,
  };
  return { artifact, artifactText, manifest };
}

export function verifyRelease(artifactText, manifest, expected = {}) {
  const artifact = JSON.parse(artifactText);
  if (manifest.algorithm !== "sha256") throw new Error("unsupported digest algorithm");
  if (sha256(artifactText) !== manifest.digest) throw new Error("artifact digest mismatch");
  if (artifact.commit !== manifest.commit || artifact.version !== manifest.version) {
    throw new Error("artifact and manifest identity mismatch");
  }
  if (expected.digest && manifest.digest !== expected.digest) throw new Error("unexpected artifact digest");
  if (expected.commit && artifact.commit !== expected.commit) throw new Error("unexpected artifact commit");
  if (expected.version && artifact.version !== expected.version) throw new Error("unexpected artifact version");
  return { artifact, digest: manifest.digest };
}

export function createOidcTrustContract({
  repositoryId,
  repositoryOwnerId,
  environment,
  jobWorkflowRef,
  audience,
}) {
  if (![repositoryId, repositoryOwnerId, environment, jobWorkflowRef, audience].every(Boolean)) {
    throw new Error("OIDC trust inputs are required");
  }
  return {
    issuer: "https://token.actions.githubusercontent.com",
    audience,
    requiredClaims: {
      repository_id: String(repositoryId),
      repository_owner_id: String(repositoryOwnerId),
      environment,
      job_workflow_ref: jobWorkflowRef,
    },
  };
}

export function authorizeOidcClaims(claims, contract) {
  if (claims.iss !== contract.issuer || claims.aud !== contract.audience) return false;
  return Object.entries(contract.requiredClaims).every(([name, value]) => claims[name] === value);
}

export function createEnvironmentState(environment, currentDigest = BASELINE_DIGEST) {
  if (!/^(staging|lab-production)$/.test(environment)) throw new Error("unsupported environment");
  return {
    schemaVersion: 1,
    environment,
    currentDigest,
    previousDigest: null,
    history: [],
  };
}

function validateRequest(state, request) {
  if (request.environment !== state.environment) throw new Error("environment state mismatch");
  if (!/^deploy:[a-z0-9._-]+:[0-9a-f]{7,64}$/i.test(request.idempotencyKey)) {
    throw new Error("invalid idempotency key");
  }
  if (!/^sha256:[0-9a-f]{64}$/i.test(request.digest)) throw new Error("invalid artifact digest");
}

export function applyDeployment(state, request, failureMode = "none") {
  validateRequest(state, request);
  const existing = state.history.find((entry) => entry.idempotencyKey === request.idempotencyKey);
  if (existing) {
    if (existing.digest !== request.digest) throw new Error("idempotency key reused for another artifact");
    return { state, outcome: "already-applied", wrote: false };
  }

  if (failureMode === "before-write") {
    return { state, outcome: "failed-before-write", wrote: false };
  }
  if (!["none", "after-write"].includes(failureMode)) throw new Error("unsupported failure mode");

  const next = structuredClone(state);
  next.previousDigest = state.currentDigest;
  next.currentDigest = request.digest;
  next.history.push({
    idempotencyKey: request.idempotencyKey,
    digest: request.digest,
    status: "applied",
  });
  return {
    state: next,
    outcome: failureMode === "after-write" ? "uncertain-after-write" : "applied",
    wrote: true,
  };
}

export function reconcileDeployment(state, request) {
  validateRequest(state, request);
  const existing = state.history.find((entry) => entry.idempotencyKey === request.idempotencyKey);
  if (!existing) return { resolution: "not-applied", safeToRetry: true };
  if (existing.digest !== request.digest) return { resolution: "conflict", safeToRetry: false };
  if (state.currentDigest === request.digest) return { resolution: "applied", safeToRetry: false };
  return { resolution: "superseded", safeToRetry: false };
}

export function evaluateHealth(signals, thresholds = {}) {
  const policy = {
    minimumRequests: thresholds.minimumRequests ?? 100,
    maximumErrorRate: thresholds.maximumErrorRate ?? 0.02,
    maximumP95LatencyMs: thresholds.maximumP95LatencyMs ?? 500,
  };
  const failures = [];
  if (signals.requests < policy.minimumRequests) failures.push("insufficient sample");
  if (signals.errorRate > policy.maximumErrorRate) failures.push("error rate above threshold");
  if (signals.p95LatencyMs > policy.maximumP95LatencyMs) failures.push("p95 latency above threshold");
  return { pass: failures.length === 0, failures, policy, signals };
}

export function rollbackDeployment(state, expectedCurrentDigest, reason) {
  if (state.currentDigest !== expectedCurrentDigest) throw new Error("rollback compare-and-swap failed");
  if (!state.previousDigest) throw new Error("no previous release is available");
  if (!reason?.trim()) throw new Error("rollback reason is required");
  const next = structuredClone(state);
  const rollbackDigest = state.previousDigest;
  next.previousDigest = state.currentDigest;
  next.currentDigest = rollbackDigest;
  next.history.push({
    idempotencyKey: `rollback:${state.history.length + 1}`,
    digest: rollbackDigest,
    status: "rolled-back",
    reason,
  });
  return next;
}
