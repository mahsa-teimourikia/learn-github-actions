import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { planChanges } from "../src/change-plan.mjs";

const casesPath = fileURLToPath(new URL("../change-cases.json", import.meta.url));
const cases = JSON.parse(readFileSync(casesPath, "utf8"));
let exact = 0;
let selected = 0;
let baseline = 0;

for (const testCase of cases) {
  const plan = planChanges(testCase.files);
  const matches = JSON.stringify(plan.services) === JSON.stringify(testCase.expected);
  if (matches && plan.failSafe === Boolean(testCase.failSafe)) exact += 1;
  selected += plan.metrics.selectedJobs;
  baseline += 3;
  console.log(`${matches ? "PASS" : "FAIL"} ${testCase.name}: ${plan.services.join(",") || "none"}`);
}

const result = {
  cases: cases.length,
  exactCases: exact,
  exactCaseRate: exact / cases.length,
  baselineJobs: baseline,
  selectiveJobs: selected,
  jobsAvoided: baseline - selected,
};

console.log(JSON.stringify(result));
if (exact !== cases.length) process.exitCode = 1;
