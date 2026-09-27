import path from "node:path";
import { appendFile } from "node:fs/promises";
import { classifyOutcome } from "../src/maintenance.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const report = await classifyOutcome({
  operationFile: path.join(fixtureRoot, "reports/operation.json"),
  reconciliationFile: path.join(fixtureRoot, "reports/reconciliation.json"),
  retryFile: path.join(fixtureRoot, "reports/retry-operation.json"),
  reportFile: path.join(fixtureRoot, "reports/decision.json")
});
if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    "## Maintenance outcome",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Terminal state | ${report.terminal} |`,
    `| Failure class | ${report.failureClass} |`,
    `| Reason code | ${report.reasonCode} |`,
    `| Reconciliation | ${report.reconciliation} |`,
    `| Retry attempted | ${report.retryAttempted} |`,
    `| Retry outcome | ${report.retryOutcome} |`
  ].join("\n");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `terminal=${report.terminal}\nfailure_class=${report.failureClass}\n`);
console.log(JSON.stringify(report));
