import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function executeMaintenance({ mode, attempt, idempotencyKey, stateFile, reportFile, now = () => new Date().toISOString() }) {
  if (!["none", "deterministic", "transient-before-write", "transient-after-write", "flaky"].includes(mode)) {
    throw new Error(`unsupported failure mode: ${mode}`);
  }
  const state = await readJson(stateFile, { operations: {} });
  const prior = state.operations[idempotencyKey];
  if (prior) {
    const report = { idempotencyKey, mode, attempt, outcome: "success", classification: "duplicate-reconciled", writeState: "already-applied", appliedAt: prior.appliedAt };
    await mkdir(path.dirname(reportFile), { recursive: true });
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);
    return { report, exitCode: 0 };
  }

  const base = { idempotencyKey, mode, attempt, observedAt: now() };
  let report;
  let exitCode;
  if (mode === "deterministic") {
    report = { ...base, outcome: "failure", classification: "deterministic", reasonCode: "invalid-maintenance-plan", writeState: "not-attempted" };
    exitCode = 2;
  } else if (mode === "flaky" && attempt === 1) {
    report = { ...base, outcome: "failure", classification: "flaky-candidate", reasonCode: "intermittent-test", writeState: "not-attempted" };
    exitCode = 1;
  } else if (mode === "transient-before-write") {
    report = { ...base, outcome: "failure", classification: "external-transient", reasonCode: "connection-reset-before-write", writeState: "unknown" };
    exitCode = 75;
  } else {
    const appliedAt = now();
    state.operations[idempotencyKey] = { appliedAt, attempt };
    await mkdir(path.dirname(stateFile), { recursive: true });
    await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
    if (mode === "transient-after-write") {
      report = { ...base, outcome: "failure", classification: "external-transient", reasonCode: "response-lost-after-write", writeState: "unknown", appliedAt };
      exitCode = 75;
    } else {
      report = { ...base, outcome: "success", classification: "none", reasonCode: "completed", writeState: "applied", appliedAt };
      exitCode = 0;
    }
  }
  await mkdir(path.dirname(reportFile), { recursive: true });
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  return { report, exitCode };
}

export async function reconcileOperation({ operationFile, stateFile, reportFile }) {
  const operation = await readJson(operationFile, null);
  if (!operation) throw new Error("operation evidence is missing");
  const state = await readJson(stateFile, { operations: {} });
  const applied = Boolean(state.operations[operation.idempotencyKey]);
  let resolution = "not-needed";
  let safeToRetry = false;
  if (operation.outcome === "failure") {
    if (applied) resolution = "applied";
    else if (operation.reasonCode === "connection-reset-before-write") {
      resolution = "not-applied";
      safeToRetry = true;
    } else resolution = "unresolved";
  }
  const report = { idempotencyKey: operation.idempotencyKey, resolution, safeToRetry, authoritativeState: applied ? "applied" : "absent" };
  await mkdir(path.dirname(reportFile), { recursive: true });
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

export async function classifyOutcome({ operationFile, reconciliationFile, retryFile, reportFile }) {
  const operation = await readJson(operationFile, null);
  const reconciliation = await readJson(reconciliationFile, { resolution: "not-needed", safeToRetry: false });
  const retry = await readJson(retryFile, null);
  if (!operation) throw new Error("operation evidence is missing");
  const recovered = operation.outcome === "success" || reconciliation.resolution === "applied" || (reconciliation.resolution === "not-applied" && retry?.outcome === "success");
  const report = {
    terminal: recovered ? "success" : "failure",
    failureClass: recovered && operation.outcome === "success" ? "none" : operation.classification,
    initialOutcome: operation.outcome,
    reconciliation: reconciliation.resolution,
    retryAttempted: Boolean(retry),
    retryOutcome: retry?.outcome ?? "not-run",
    reasonCode: operation.reasonCode
  };
  await mkdir(path.dirname(reportFile), { recursive: true });
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

export { readJson };
