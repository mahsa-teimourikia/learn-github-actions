import { appendFileSync, readFileSync } from "node:fs";
import { applyDeployment, verifyRelease } from "../src/release-lifecycle.mjs";
import { readState, writeState } from "../src/state-store.mjs";

const environment = process.env.TARGET_ENVIRONMENT ?? "staging";
const idempotencyKey = process.env.IDEMPOTENCY_KEY;
const failureMode = process.env.FAILURE_MODE ?? "none";
const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
verifyRelease(readFileSync("dist/northstar-release.json", "utf8"), manifest);

const request = { environment, idempotencyKey, digest: manifest.digest };
const result = applyDeployment(readState(environment), request, failureMode);
if (result.wrote) writeState(result.state);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `digest=${manifest.digest}\noutcome=${result.outcome}\n`);
}
console.log(JSON.stringify({ ...result, request }));
if (result.outcome === "failed-before-write") process.exitCode = 74;
if (result.outcome === "uncertain-after-write") process.exitCode = 75;
