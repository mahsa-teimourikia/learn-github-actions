import {
  applyDeployment,
  createEnvironmentState,
  createRelease,
  evaluateHealth,
  reconcileDeployment,
  rollbackDeployment,
} from "../src/release-lifecycle.mjs";

const release = createRelease(
  { service: "northstar-checkout", runtime: "nodejs24", features: ["checkout"] },
  { version: "v2.4.0", commit: "abcdef0123456789abcdef0123456789abcdef01" },
);
const request = {
  environment: "lab-production",
  idempotencyKey: "deploy:v2.4.0:abcdef0123456789abcdef0123456789abcdef01",
  digest: release.manifest.digest,
};
const initial = createEnvironmentState("lab-production");
const uncertain = applyDeployment(initial, request, "after-write");
const reconciliation = reconcileDeployment(uncertain.state, request);
const health = evaluateHealth({ requests: 600, errorRate: 0.075, p95LatencyMs: 720 });
const rolledBack = rollbackDeployment(uncertain.state, request.digest, "canary gate failed");

const result = {
  uncertainOutcome: uncertain.outcome,
  reconciliation: reconciliation.resolution,
  retryAllowed: reconciliation.safeToRetry,
  healthPass: health.pass,
  rollbackRestoredBaseline: rolledBack.currentDigest === initial.currentDigest,
};
console.log(JSON.stringify(result));
if (JSON.stringify(result) !== JSON.stringify({
  uncertainOutcome: "uncertain-after-write",
  reconciliation: "applied",
  retryAllowed: false,
  healthPass: false,
  rollbackRestoredBaseline: true,
})) process.exitCode = 1;
