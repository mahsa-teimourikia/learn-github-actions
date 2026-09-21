import { readFileSync } from "node:fs";
import { rollbackDeployment } from "../src/release-lifecycle.mjs";
import { readState, writeState } from "../src/state-store.mjs";

const environment = process.env.TARGET_ENVIRONMENT ?? "staging";
const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const state = rollbackDeployment(
  readState(environment),
  process.env.EXPECTED_CURRENT_DIGEST ?? manifest.digest,
  process.env.ROLLBACK_REASON ?? "canary gate failed",
);
writeState(state);
console.log(JSON.stringify(state));
