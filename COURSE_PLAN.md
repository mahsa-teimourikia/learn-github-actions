# Course improvement plan

This plan governs the incremental review and improvement of the six-course GitHub Actions curriculum. Each course is completed and validated as a vertical slice before work begins on the next one.

## Quality bar for every course

A course is complete only when a learner can:

1. explain the motivation, mental model, mechanics, architecture choices, and trust boundaries;
2. install and run a workflow lab from a clean practice branch or fork;
3. inspect a realistic baseline and improve it using observable evidence;
4. execute at least two meaningful experiments, inject a failure, measure the result, and apply a mitigation;
5. compare common tools or methods using explicit selection criteria;
6. distinguish established practice, current platform capabilities, emerging approaches, and open operational problems;
7. describe a production upgrade path covering security, permissions, identity, concurrency, observability, cost, rollback, and governance as applicable; and
8. trace important claims to official GitHub documentation, official action repositories, maintained tool repositories, or primary standards.

Every improved course retains one `README.md`, guided workflow exercises, starter and reference workflow YAML, realistic lesson-owned fixtures where useful, focused tests, a Hub checkpoint, and links into the full quiz. GitHub Actions is taught through GitHub Actions itself; notebooks and simulated `lab.py` runtimes are deliberately excluded because they hide the scheduler, event context, checks, logs, artifacts, permissions, and runner isolation learners need to observe.

## Baseline audit

The initial structure is sound: lessons are ordered, examples are colocated, local validation passes, and the Hub provides navigation and checkpoints. The material is not yet deep enough for the new quality bar.

Common gaps across the current six lessons:

- READMEs are 550–715 words and function mainly as concise references rather than teachable technical chapters.
- Early notebooks and Python simulators did not expose real GitHub scheduling, contexts, checks, logs, artifacts, permissions, or cancellation. They have been removed in favor of workflow-native exercises.
- Tool landscapes omit important workflow tooling such as GitHub CLI, `actionlint`, `zizmor`, local emulation, dependency automation, runner management, policy controls, and provenance tooling.
- State-of-the-art sections do not distinguish mature platform practice from newer capabilities such as cache access modes, current Node 24-based action releases, runner scale sets, artifact attestations, and policy enforcement.
- Examples are readable but several action versions and runtime assumptions need current verification, and the first CI example is not backed by a runnable application fixture.
- Course-specific tests and negative cases are absent; repository validation proves file shape, not the lesson’s technical claims.

## Ordered implementation roadmap

### 1. Beginner — Actions foundations

**Keep:** the event → workflow → job → runner → step → result model, data-flow table, trust-boundary warning, execution diagram, and read-only CI example.

**Deepen:** event/ref/SHA selection, workflow evaluation, job DAG scheduling, step processes, runner lifecycle, contexts, default token, outputs/artifacts/caches, check runs, cancellation, and cost.

**Implement:** a realistic Node service fixture; executable tests/build/report generation; a progressive workflow starter; a hardened reference solution; success, test-failure, missing-artifact, invalid-dependency, and cancellation experiments; current tool landscape; and focused workflow tests.

### 2. Beginner — Workflow syntax

**Keep:** the practical syntax tour, safe expression-to-environment boundary, permissions-first framing, and manual-dispatch example.

**Deepen:** YAML parsing semantics, context availability, expression coercion, job/step conditions, defaults, service containers, container jobs, outputs, matrix expansion, reusable workflow contracts, cache access modes, and validation boundaries.

**Implement:** progressive good/bad workflow fixtures; expression and matrix experiments; `actionlint` integration guidance; event-payload inspection; schema, context, shell-injection, and dependency failures; and syntax-focused tests.

### 3. Intermediate — Workflow design

**Keep:** trust-first trigger choice, cache/artifact distinction, reuse comparison, and matrix/path/reusable examples.

**Deepen:** DAG critical paths, fan-out cost, change detection, reusable API versioning, composite actions, concurrency groups, cancellation semantics, cache poisoning, monorepo orchestration, and required workflows.

**Implement:** a multi-service monorepo fixture; changed-path and matrix workflows; a versioned reusable-workflow contract; baseline versus selective CI experiments; cache and path-filter failure injection; and run-based cost and latency evaluation.

### 4. Intermediate — Deployment patterns

**Keep:** build-once promotion, environment approvals, OIDC, Pages, release, and retry/reconciliation guidance.

**Deepen:** artifact identity and digest verification, deployment state machines, environment protection, cloud claims, provenance, attestations, release immutability, progressive delivery, rollback, and separation of duties.

**Implement:** workflow labs with immutable artifacts, checksums, staged environments, approvals, OIDC claim inspection, idempotency keys, canary signals, rollback, uncertain-write reconciliation, and release-gate tests using safe mock deployment targets by default.

### 5. Advanced — Security and reliability

**Keep:** least privilege, action pinning, fork boundaries, shell injection, OIDC, runner isolation, concurrency, and idempotency.

**Deepen:** the GitHub Actions threat model, token issuance and persistence, credential theft, cache/artifact poisoning, pwn requests, dependency confusion, compromised actions, runner persistence, policy enforcement, provenance, and incident containment.

**Implement:** vulnerable and hardened workflow fixtures; `zizmor` and `actionlint` checks; permission and trust-boundary experiments; negative authorization tests; policy gates; attack-path evidence; and measurable risk reduction.

### 6. Advanced — Debugging and operations

**Keep:** evidence-led triage, failure taxonomy, targeted logging, rerun policy, observability, and incident response.

**Deepen:** Checks API/run/job/step relationships, structured summaries, annotations, logs and retention, queue time, cancellation, flakiness, external dependencies, runner/image drift, SLOs, cost telemetry, and audit evidence.

**Implement:** intentionally failing and flaky workflow fixtures; run-log and critical-path analysis; failure reason codes; retry budgets and reconciliation policy; SLI/SLO calculation from exported run data; incident timeline reconstruction; and operations-focused checks.

## Research and versioning policy

- Prefer current official GitHub documentation and official action repositories.
- Use maintained tool repositories as the authority for third-party tool capabilities.
- Record the date for fast-moving release guidance and avoid freezing volatile limits in prose when a canonical reference exists.
- Use readable major tags only in explicitly educational examples; show immutable full-SHA pinning as the production default.
- Keep cloud paths optional and use safe mock targets by default. Labs may consume ordinary GitHub Actions minutes, but must require no production credentials or irreversible external side effects.

## Validation after every course

- Run the focused course tests and validate every starter/reference workflow fixture.
- Run the lesson-owned sample application or fixtures.
- Run `python3 scripts/validate_learning.py --all` and `npm test`.
- Validate local links and current source URLs.
- Confirm the Hub registry, checkpoint, and quiz references still match the lesson.
- Run `git diff --check` and inspect lab instructions for stale versions or misleading expected results.

## Progress

| Order | Course | Status |
| --- | --- | --- |
| 1 | Actions foundations | Completed and validated |
| 2 | Workflow syntax | Completed and validated |
| 3 | Workflow design | Completed and validated |
| 4 | Deployment patterns | Next |
| 5 | Security and reliability | Planned |
| 6 | Debugging and operations | Planned |
