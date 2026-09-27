import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { analyzeWorkflow, summarizeFindings } from "../src/workflow-policy.mjs";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonRoot = path.resolve(fixtureRoot, "..");
const cases = JSON.parse(await readFile(path.join(fixtureRoot, "cases/workflow-cases.json"), "utf8"));

const results = [];
for (const scenario of cases) {
  const vulnerableText = await readFile(path.join(lessonRoot, scenario.vulnerable), "utf8");
  const hardenedText = await readFile(path.join(lessonRoot, scenario.hardened), "utf8");
  const vulnerableFindings = analyzeWorkflow(vulnerableText, scenario.vulnerable);
  const hardenedFindings = analyzeWorkflow(hardenedText, scenario.hardened);
  const vulnerableIds = vulnerableFindings.map(({ id }) => id).sort();
  const hardenedIds = hardenedFindings.map(({ id }) => id).sort();
  const expectedVulnerable = [...scenario.expectedVulnerableFindings].sort();
  const expectedHardened = [...scenario.expectedHardenedFindings].sort();
  results.push({
    id: scenario.id,
    vulnerable: { findings: vulnerableFindings, summary: summarizeFindings(vulnerableFindings) },
    hardened: { findings: hardenedFindings, summary: summarizeFindings(hardenedFindings) },
    exact: JSON.stringify(vulnerableIds) === JSON.stringify(expectedVulnerable) && JSON.stringify(hardenedIds) === JSON.stringify(expectedHardened)
  });
}

const vulnerableRisk = results.reduce((sum, result) => sum + result.vulnerable.summary.riskScore, 0);
const hardenedRisk = results.reduce((sum, result) => sum + result.hardened.summary.riskScore, 0);
const exactCases = results.filter(({ exact }) => exact).length;
const report = {
  schemaVersion: 1,
  cases: results.length,
  exactCaseRate: exactCases / results.length,
  vulnerableRisk,
  hardenedRisk,
  riskReduction: vulnerableRisk === 0 ? 0 : (vulnerableRisk - hardenedRisk) / vulnerableRisk,
  criticalOrHighRemaining: results.reduce((sum, result) => sum + result.hardened.summary.critical + result.hardened.summary.high, 0),
  results
};

await mkdir(path.join(fixtureRoot, "reports"), { recursive: true });
await writeFile(path.join(fixtureRoot, "reports/workflow-risk.json"), `${JSON.stringify(report, null, 2)}\n`);

const summary = [
  "## Workflow attack-path evaluation",
  "",
  "| Metric | Result |",
  "| --- | ---: |",
  `| Labeled cases matched | ${exactCases}/${results.length} |`,
  `| Vulnerable risk points | ${vulnerableRisk} |`,
  `| Hardened risk points | ${hardenedRisk} |`,
  `| Critical/high findings remaining | ${report.criticalOrHighRemaining} |`,
  "",
  "This deterministic teaching policy complements—not replaces—zizmor, actionlint, CodeQL, dependency review, and human threat modeling."
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: "a" });
console.log(JSON.stringify(report));

if (report.exactCaseRate !== 1 || report.criticalOrHighRemaining !== 0) process.exitCode = 1;
