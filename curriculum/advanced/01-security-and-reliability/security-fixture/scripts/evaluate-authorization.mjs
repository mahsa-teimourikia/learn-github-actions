import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { authorize } from "../src/authorization-policy.mjs";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(await readFile(path.join(fixtureRoot, "cases/authorization-cases.json"), "utf8"));
const results = cases.map((scenario) => {
  const actual = authorize(scenario.request);
  return { id: scenario.id, expected: scenario.expected, actual, exact: JSON.stringify(actual) === JSON.stringify(scenario.expected) };
});
const exact = results.filter((result) => result.exact).length;
const report = { schemaVersion: 1, cases: results.length, exactDecisionRate: exact / results.length, denied: results.filter((result) => !result.actual.allow).length, results };

await mkdir(path.join(fixtureRoot, "reports"), { recursive: true });
await writeFile(path.join(fixtureRoot, "reports/authorization.json"), `${JSON.stringify(report, null, 2)}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `\n## Authorization policy\n\nExact decisions: ${exact}/${results.length}; denied unsafe requests: ${report.denied}.\n`, { flag: "a" });
}
console.log(JSON.stringify(report));
if (report.exactDecisionRate !== 1) process.exitCode = 1;
