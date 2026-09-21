import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

await mkdir("test-results", { recursive: true });
const result = spawnSync(
  process.execPath,
  ["--test", "--test-reporter=tap", "test/renewal-policy.test.mjs"],
  {
  encoding: "utf8",
  },
);

const report = [
  "# Northstar renewal-policy CI report",
  `exit_code=${result.status ?? 1}`,
  `node=${process.version}`,
  "",
  result.stdout,
  result.stderr,
].join("\n");

await writeFile("test-results/test-report.txt", report);
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
