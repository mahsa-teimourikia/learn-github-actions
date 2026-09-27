function secondsBetween(start, end) {
  return (Date.parse(end) - Date.parse(start)) / 1000;
}

export function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.max(1, Math.ceil(percentileValue * sorted.length));
  return sorted[rank - 1];
}

export function criticalPathSeconds(jobs) {
  const byName = new Map(jobs.map((job) => [job.name, job]));
  const memo = new Map();
  const visit = (name, active = new Set()) => {
    if (memo.has(name)) return memo.get(name);
    if (active.has(name)) throw new Error(`cycle in job graph at ${name}`);
    const job = byName.get(name);
    if (!job) throw new Error(`unknown job dependency: ${name}`);
    const next = new Set(active).add(name);
    const upstream = (job.needs ?? []).map((dependency) => visit(dependency, next));
    const total = job.durationSeconds + (upstream.length ? Math.max(...upstream) : 0);
    memo.set(name, total);
    return total;
  };
  return Math.max(...jobs.map((job) => visit(job.name)), 0);
}

export function evaluateHistory(dataset) {
  const runs = dataset.runs;
  const terminal = runs.filter((run) => run.conclusion);
  const successes = terminal.filter((run) => run.conclusion === "success").length;
  const queueSeconds = terminal.map((run) => secondsBetween(run.createdAt, run.startedAt));
  const durationSeconds = terminal.map((run) => secondsBetween(run.startedAt, run.completedAt));
  const logical = new Map();
  for (const run of terminal) {
    if (!logical.has(run.logicalId)) logical.set(run.logicalId, []);
    logical.get(run.logicalId).push(run);
  }
  const initiallyFailed = [...logical.values()].filter((attempts) => attempts.some((run) => run.attempt === 1 && run.conclusion !== "success"));
  const recoveredWithoutChange = initiallyFailed.filter((attempts) => {
    const first = attempts.find((run) => run.attempt === 1);
    return attempts.some((run) => run.attempt > 1 && run.conclusion === "success" && run.headSha === first.headSha);
  }).length;
  const badTerminals = terminal.length - successes;
  const allowedBad = terminal.length * (1 - dataset.slo.terminalSuccess);
  const report = {
    runCount: terminal.length,
    logicalRunCount: logical.size,
    scheduleDeliveryRate: dataset.observedSchedules / dataset.expectedSchedules,
    terminalSuccessRate: successes / terminal.length,
    queueP95Seconds: percentile(queueSeconds, 0.95),
    durationP95Seconds: percentile(durationSeconds, 0.95),
    runnerMinutes: durationSeconds.reduce((sum, seconds) => sum + seconds, 0) / 60,
    recoveredWithoutChange,
    flakeCandidateRate: initiallyFailed.length ? recoveredWithoutChange / initiallyFailed.length : 0,
    retryAmplification: terminal.length / logical.size,
    averageCriticalPathSeconds: runs.reduce((sum, run) => sum + criticalPathSeconds(run.jobs), 0) / runs.length,
    errorBudgetBurn: allowedBad === 0 ? (badTerminals ? Infinity : 0) : badTerminals / allowedBad
  };
  report.objectives = {
    scheduleDelivery: report.scheduleDeliveryRate >= dataset.slo.scheduleDelivery,
    terminalSuccess: report.terminalSuccessRate >= dataset.slo.terminalSuccess,
    queueP95: report.queueP95Seconds <= dataset.slo.queueP95Seconds,
    durationP95: report.durationP95Seconds <= dataset.slo.durationP95Seconds
  };
  return report;
}

export function buildTimeline(events) {
  const sorted = [...events].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
  const first = sorted[0];
  const detection = sorted.find((event) => event.kind === "failure-detected");
  const recovery = sorted.find((event) => event.kind === "recovered");
  return {
    incidentId: first.incidentId,
    events: sorted,
    timeToDetectSeconds: detection ? secondsBetween(first.at, detection.at) : null,
    timeToRecoverSeconds: recovery ? secondsBetween(first.at, recovery.at) : null,
    rootCause: sorted.find((event) => event.kind === "root-cause")?.detail ?? "unresolved",
    retryAttempted: sorted.some((event) => event.kind === "retry")
  };
}
