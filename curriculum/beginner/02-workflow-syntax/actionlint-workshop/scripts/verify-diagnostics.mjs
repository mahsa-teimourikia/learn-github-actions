import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const workshop = path.resolve(import.meta.dirname, "..");
const lesson = path.resolve(workshop, "..");
const manifest = JSON.parse(await readFile(path.join(workshop, "diagnostics.json"), "utf8"));
const executable = process.env.ACTIONLINT_BIN || "actionlint";
const formatter = "{{json .}}";
const reports = [];

const versionResult = spawnSync(executable, ["-version"], { cwd: lesson, encoding: "utf8" });
if (versionResult.error) {
  throw new Error(`could not run ${executable}: ${versionResult.error.message}`);
}
const observedVersion = versionResult.stdout.trim().split("\n", 1)[0];
const versionPassed = versionResult.status === 0 && observedVersion === manifest.actionlintVersion;

function runActionlint(file) {
  const result = spawnSync(
    executable,
    ["-no-color", "-shellcheck=", "-pyflakes=", "-format", formatter, file],
    { cwd: lesson, encoding: "utf8" },
  );
  if (result.error) {
    throw new Error(`could not run ${executable}: ${result.error.message}`);
  }
  let diagnostics = [];
  if (result.stdout.trim()) diagnostics = JSON.parse(result.stdout);
  return { exitCode: result.status, diagnostics, stderr: result.stderr.trim() };
}

for (const testCase of manifest.cases) {
  const relativeToLesson = path.posix.join("actionlint-workshop", testCase.file);
  const result = runActionlint(relativeToLesson);
  const observedKinds = [...new Set(result.diagnostics.map((item) => item.kind))].sort();
  const missingKinds = testCase.expectedKinds.filter((kind) => !observedKinds.includes(kind));
  const passed = result.exitCode !== 0 && missingKinds.length === 0;
  reports.push({
    file: testCase.file,
    objective: testCase.objective,
    expectedKinds: testCase.expectedKinds,
    observedKinds,
    diagnosticCount: result.diagnostics.length,
    exitCode: result.exitCode,
    passed,
    missingKinds,
  });
}

const solution = runActionlint(manifest.solution);
const solutionPassed = solution.exitCode === 0 && solution.diagnostics.length === 0;
const report = {
  expectedActionlintVersion: manifest.actionlintVersion,
  observedActionlintVersion: observedVersion,
  versionPassed,
  casesPassed: reports.filter((item) => item.passed).length,
  caseCount: reports.length,
  casePassRate: reports.filter((item) => item.passed).length / reports.length,
  solutionPassed,
  cases: reports,
};

await mkdir(path.join(workshop, "reports"), { recursive: true });
await writeFile(path.join(workshop, "reports/diagnostics.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));

if (!report.versionPassed || report.casePassRate !== 1 || !report.solutionPassed) process.exitCode = 1;
