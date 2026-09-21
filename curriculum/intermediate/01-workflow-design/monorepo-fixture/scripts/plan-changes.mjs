import { appendFileSync, readFileSync } from "node:fs";
import { planChanges } from "../src/change-plan.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function readChangedFiles() {
  const file = argument("--files");
  if (file) return readFileSync(file, "utf8").split(/\r?\n/);
  if (process.env.CHANGED_FILES_JSON) return JSON.parse(process.env.CHANGED_FILES_JSON);
  return ["services/catalog/src/catalog.mjs"];
}

const plan = planChanges(readChangedFiles(), {
  baseline: process.argv.includes("--baseline"),
});
const serializedMatrix = JSON.stringify(plan.matrix);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `matrix=${serializedMatrix}`,
      `run_services=${plan.services.length > 0}`,
      `selected_count=${plan.metrics.selectedJobs}`,
      `jobs_avoided=${plan.metrics.jobsAvoided}`,
      `fail_safe=${plan.failSafe}`,
    ].join("\n") + "\n",
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = plan.services.length
    ? plan.services.map((service) => `| ${service} | ${plan.reasons[service].join("; ")} |`).join("\n")
    : "| _none_ | Documentation-only change |";
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      "## Change plan",
      "",
      "| Service | Selection reason |",
      "| --- | --- |",
      rows,
      "",
      `Jobs avoided: **${plan.metrics.jobsAvoided}**`,
      `Estimated runner minutes: **${plan.metrics.estimatedRunnerMinutes}**`,
      `Fail-safe activated: **${plan.failSafe}**`,
      "",
    ].join("\n"),
  );
}

console.log(JSON.stringify(plan));
