import path from "node:path";
import { reconcileOperation } from "../src/maintenance.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const report = await reconcileOperation({
  operationFile: path.join(fixtureRoot, "reports/operation.json"),
  stateFile: process.env.STATE_FILE || path.join(fixtureRoot, ".state/target.json"),
  reportFile: path.join(fixtureRoot, "reports/reconciliation.json")
});
if (process.env.GITHUB_OUTPUT) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_OUTPUT, `resolution=${report.resolution}\nsafe_to_retry=${report.safeToRetry}\n`);
}
console.log(JSON.stringify(report));
