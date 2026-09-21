import { appendFileSync } from "node:fs";
import { evaluateHealth } from "../src/release-lifecycle.mjs";

const mode = process.env.HEALTH_MODE ?? "healthy";
const signals = mode === "unhealthy"
  ? { requests: 600, errorRate: 0.075, p95LatencyMs: 720 }
  : { requests: 600, errorRate: 0.006, p95LatencyMs: 240 };
const result = evaluateHealth(signals);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${result.pass}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Canary signals\n\n- Requests: ${signals.requests}\n- Error rate: ${signals.errorRate}\n- p95 latency: ${signals.p95LatencyMs} ms\n- Gate: ${result.pass ? "pass" : "fail"}\n`,
  );
}
console.log(JSON.stringify(result));
if (!result.pass) process.exitCode = 1;
