import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { classifyOutcome, executeMaintenance, reconcileOperation } from "../src/maintenance.mjs";
import { buildTimeline, criticalPathSeconds, evaluateHistory, percentile } from "../src/metrics.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");

async function workspace() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "operations-fixture-"));
  return {
    directory,
    stateFile: path.join(directory, "state.json"),
    operationFile: path.join(directory, "operation.json"),
    reconciliationFile: path.join(directory, "reconciliation.json"),
    retryFile: path.join(directory, "retry.json"),
    decisionFile: path.join(directory, "decision.json")
  };
}

test("healthy maintenance applies one idempotent operation", async () => {
  const files = await workspace();
  const first = await executeMaintenance({ mode: "none", attempt: 1, idempotencyKey: "key-1", stateFile: files.stateFile, reportFile: files.operationFile });
  const duplicate = await executeMaintenance({ mode: "none", attempt: 2, idempotencyKey: "key-1", stateFile: files.stateFile, reportFile: files.retryFile });
  assert.equal(first.exitCode, 0);
  assert.equal(first.report.writeState, "applied");
  assert.equal(duplicate.report.writeState, "already-applied");
});

test("after-write timeout reconciles to applied and forbids retry", async () => {
  const files = await workspace();
  const operation = await executeMaintenance({ mode: "transient-after-write", attempt: 1, idempotencyKey: "key-2", stateFile: files.stateFile, reportFile: files.operationFile });
  const reconciliation = await reconcileOperation({ operationFile: files.operationFile, stateFile: files.stateFile, reportFile: files.reconciliationFile });
  assert.equal(operation.exitCode, 75);
  assert.deepEqual(reconciliation, { idempotencyKey: "key-2", resolution: "applied", safeToRetry: false, authoritativeState: "applied" });
});

test("before-write timeout permits one same-key retry after reconciliation", async () => {
  const files = await workspace();
  await executeMaintenance({ mode: "transient-before-write", attempt: 1, idempotencyKey: "key-3", stateFile: files.stateFile, reportFile: files.operationFile });
  const reconciliation = await reconcileOperation({ operationFile: files.operationFile, stateFile: files.stateFile, reportFile: files.reconciliationFile });
  assert.equal(reconciliation.safeToRetry, true);
  const retry = await executeMaintenance({ mode: "none", attempt: 1, idempotencyKey: "key-3", stateFile: files.stateFile, reportFile: files.retryFile });
  assert.equal(retry.report.outcome, "success");
  const decision = await classifyOutcome({ operationFile: files.operationFile, reconciliationFile: files.reconciliationFile, retryFile: files.retryFile, reportFile: files.decisionFile });
  assert.equal(decision.terminal, "success");
  assert.equal(decision.retryAttempted, true);
});

test("deterministic failure is classified and never automatically retried", async () => {
  const files = await workspace();
  await executeMaintenance({ mode: "deterministic", attempt: 1, idempotencyKey: "key-4", stateFile: files.stateFile, reportFile: files.operationFile });
  const reconciliation = await reconcileOperation({ operationFile: files.operationFile, stateFile: files.stateFile, reportFile: files.reconciliationFile });
  const decision = await classifyOutcome({ operationFile: files.operationFile, reconciliationFile: files.reconciliationFile, retryFile: files.retryFile, reportFile: files.decisionFile });
  assert.equal(reconciliation.safeToRetry, false);
  assert.equal(decision.terminal, "failure");
  assert.equal(decision.failureClass, "deterministic");
});

test("flaky candidate recovers only on a new workflow attempt", async () => {
  const firstFiles = await workspace();
  const secondFiles = await workspace();
  const first = await executeMaintenance({ mode: "flaky", attempt: 1, idempotencyKey: "key-5", stateFile: firstFiles.stateFile, reportFile: firstFiles.operationFile });
  const second = await executeMaintenance({ mode: "flaky", attempt: 2, idempotencyKey: "key-5", stateFile: secondFiles.stateFile, reportFile: secondFiles.operationFile });
  assert.equal(first.report.classification, "flaky-candidate");
  assert.equal(first.exitCode, 1);
  assert.equal(second.report.outcome, "success");
});

test("nearest-rank percentile handles unsorted observations", () => {
  assert.equal(percentile([5, 1, 9, 3], 0.5), 3);
  assert.equal(percentile([5, 1, 9, 3], 0.95), 9);
});

test("critical path follows the longest dependency chain", () => {
  const jobs = [
    { name: "plan", durationSeconds: 10 },
    { name: "fast", durationSeconds: 20, needs: ["plan"] },
    { name: "slow", durationSeconds: 60, needs: ["plan"] },
    { name: "gate", durationSeconds: 5, needs: ["fast", "slow"] }
  ];
  assert.equal(criticalPathSeconds(jobs), 75);
});

test("historical evaluation computes reliability, latency, cost, and flake signals", async () => {
  const dataset = JSON.parse(await readFile(path.join(fixtureRoot, "data/run-history.json"), "utf8"));
  const report = evaluateHistory(dataset);
  assert.equal(report.runCount, 10);
  assert.equal(report.logicalRunCount, 9);
  assert.equal(report.scheduleDeliveryRate, 0.75);
  assert.equal(report.terminalSuccessRate, 0.7);
  assert.equal(report.queueP95Seconds, 600);
  assert.equal(report.durationP95Seconds, 1200);
  assert.equal(report.runnerMinutes, 76);
  assert.equal(report.recoveredWithoutChange, 1);
  assert.equal(report.flakeCandidateRate, 1 / 3);
  assert.equal(report.retryAmplification, 10 / 9);
  assert.equal(report.averageCriticalPathSeconds, 456);
  assert.deepEqual(report.objectives, { scheduleDelivery: false, terminalSuccess: false, queueP95: false, durationP95: true });
});

test("incident timeline sorts cross-system evidence and measures response", async () => {
  const events = JSON.parse(await readFile(path.join(fixtureRoot, "data/incident-events.json"), "utf8"));
  const timeline = buildTimeline(events);
  assert.equal(timeline.events[0].kind, "trigger");
  assert.equal(timeline.events.at(-1).kind, "root-cause");
  assert.equal(timeline.timeToDetectSeconds, 190);
  assert.equal(timeline.timeToRecoverSeconds, 211);
  assert.equal(timeline.retryAttempted, false);
  assert.match(timeline.rootCause, /response was lost after the write/);
});

test("reports never include credential-shaped fields", async () => {
  const files = await workspace();
  await executeMaintenance({ mode: "none", attempt: 1, idempotencyKey: "key-6", stateFile: files.stateFile, reportFile: files.operationFile });
  const report = JSON.parse(await readFile(files.operationFile, "utf8"));
  for (const forbidden of ["token", "secret", "password", "authorization"]) assert.equal(Object.hasOwn(report, forbidden), false);
});
