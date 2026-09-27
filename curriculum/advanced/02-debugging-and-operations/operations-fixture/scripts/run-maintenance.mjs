import path from "node:path";
import { executeMaintenance } from "../src/maintenance.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const reportName = process.env.REPORT_NAME || "operation.json";
const result = await executeMaintenance({
  mode: process.env.FAILURE_MODE || "none",
  attempt: Number(process.env.RUN_ATTEMPT || "1"),
  idempotencyKey: process.env.IDEMPOTENCY_KEY || "local:maintenance:1",
  stateFile: process.env.STATE_FILE || path.join(fixtureRoot, ".state/target.json"),
  reportFile: path.join(fixtureRoot, "reports", reportName)
});
console.log(JSON.stringify(result.report));
process.exitCode = result.exitCode;
