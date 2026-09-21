import { appendFileSync, readFileSync } from "node:fs";
import { reconcileDeployment } from "../src/release-lifecycle.mjs";
import { readState } from "../src/state-store.mjs";

const environment = process.env.TARGET_ENVIRONMENT ?? "staging";
const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const request = {
  environment,
  idempotencyKey: process.env.IDEMPOTENCY_KEY,
  digest: manifest.digest,
};
const result = reconcileDeployment(readState(environment), request);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `resolution=${result.resolution}\nsafe_to_retry=${result.safeToRetry}\n`);
}
console.log(JSON.stringify(result));
if (result.resolution === "conflict") process.exitCode = 2;
