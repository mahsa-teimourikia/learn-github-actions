import { appendFile } from "node:fs/promises";
import { createPlan, matrixSize } from "../src/release-plan.mjs";

const plan = createPlan({
  environment: process.env.TARGET_ENVIRONMENT ?? "staging",
  dryRun: process.env.DRY_RUN ?? "true",
  componentsJson: process.env.COMPONENTS_JSON ?? '["api","worker"]',
  revision: process.env.GITHUB_SHA ?? "local",
});

if (process.env.GITHUB_OUTPUT) {
  const outputs = [
    `plan_id=${plan.plan_id}`,
    `target_environment=${plan.environment}`,
    `should_release=${plan.should_release}`,
    `matrix=${JSON.stringify(plan.matrix)}`,
  ].join("\n");
  await appendFile(process.env.GITHUB_OUTPUT, `${outputs}\n`, "utf8");
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    "## Release plan",
    "",
    `- Plan: \`${plan.plan_id}\``,
    `- Environment: \`${plan.environment}\``,
    `- Dry run: \`${plan.dry_run}\``,
    `- Revision: \`${plan.revision}\``,
    `- Matrix jobs: \`${matrixSize(plan.matrix)}\``,
    `- Components: ${plan.components.map((item) => `\`${item}\``).join(", ")}`,
    "",
  ].join("\n");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
}

process.stdout.write(`${JSON.stringify(plan)}\n`);
