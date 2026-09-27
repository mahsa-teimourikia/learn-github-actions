import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateHistory } from "../src/metrics.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const dataset = JSON.parse(await readFile(path.join(fixtureRoot, "data/run-history.json"), "utf8"));
const report = evaluateHistory(dataset);
await mkdir(path.join(fixtureRoot, "reports"), { recursive: true });
await writeFile(path.join(fixtureRoot, "reports/sli-report.json"), `${JSON.stringify(report, null, 2)}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = [
    ["Schedule delivery", report.scheduleDeliveryRate, report.objectives.scheduleDelivery],
    ["Terminal success", report.terminalSuccessRate, report.objectives.terminalSuccess],
    ["Queue p95 (seconds)", report.queueP95Seconds, report.objectives.queueP95],
    ["Duration p95 (seconds)", report.durationP95Seconds, report.objectives.durationP95]
  ];
  const summary = ["## Historical workflow SLIs", "", "| SLI | Value | Objective met? |", "| --- | ---: | --- |", ...rows.map(([name, value, met]) => `| ${name} | ${value} | ${met ? "yes" : "no"} |`)].join("\n");
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: "a" });
}
console.log(JSON.stringify(report));
