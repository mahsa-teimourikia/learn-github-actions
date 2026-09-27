# Workflow lab: investigate and operate an unreliable maintenance job

This lab uses GitHub Actions as the operating environment. You will create real
runs and attempts, preserve structured evidence, classify four failure shapes,
reconcile an uncertain write, compare a rerun with its first attempt, calculate
service-level indicators, and reconstruct an incident timeline. The maintenance
provider is a deterministic local fixture, so the workflow requires no secrets
and cannot change an external system.

Allow 90–120 minutes. Use the GitHub web interface and the GitHub CLI (`gh`)
together: the interface is useful for graph and log navigation, while the CLI
makes run identity, attempts, and downloaded artifacts explicit.

## Safety boundary

- Use a fork or disposable practice repository with GitHub Actions enabled.
- Keep `permissions: contents: read`, GitHub-hosted runners, pinned action SHAs,
  bounded timeouts, and `cancel-in-progress: false`.
- Do not add secrets, OIDC, write permissions, production endpoints,
  self-hosted runner labels, or real paging/issue creation.
- Do not print tokens, complete contexts, or complete environment dumps. Logs
  and artifacts may be visible to repository readers.
- Files in `fixtures/` end in `.yml.txt`. Review them; never install them as
  runnable workflows.
- Workflow runs and retained artifacts can consume repository quota. Delete the
  copied lab workflows when the exercise is complete.

## 1. Prove the fixture locally

From the repository root, run:

```bash
cd curriculum/advanced/02-debugging-and-operations/operations-fixture
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run evaluate
```

The ten unit tests should pass. The evaluation should report ten attempts across
nine logical runs and these deliberately unhealthy signals:

- schedule delivery `0.75` from 9 observed slots out of 12 expected slots;
- terminal success `0.7`;
- queue p95 `600` seconds and duration p95 `1200` seconds;
- retry amplification `10 / 9`;
- runner consumption `76` minutes;
- average critical path `456` seconds; and
- three times the allowed error budget consumed.

The four objectives should show that delivery, terminal success, and queue p95
miss their targets while duration p95 meets its target. Inspect
`reports/sli-report.json`; do not treat the printed values as the only evidence.
Then inspect `reports/incident-timeline.json`. It should order nine deliberately
shuffled events, calculate 190 seconds to detection and 211 seconds to recovery,
and identify a response lost after the provider applied the write.

Explain why ten attempts must not be used as the denominator for nine logical
runs, and why a dataset containing only observed scheduled runs could never
detect the three missing schedule slots.

## 2. Install the evidence baseline

Return to the repository root and copy the starter:

```bash
mkdir -p .github/workflows
cp curriculum/advanced/02-debugging-and-operations/exercises/01-incident-operations-starter.yml \
  .github/workflows/lab-maintenance-baseline.yml
git add .github/workflows/lab-maintenance-baseline.yml
git commit -m "Add maintenance operations lab"
git push
```

The scheduled trigger runs only from the default branch, so use manual dispatch
for the experiments. On a branch, select **Actions → Lab - maintenance evidence
baseline → Run workflow**, choose `none`, and run it. Record:

- event, source SHA, workflow ref, run ID, run number, and run attempt;
- created, started, and completed timestamps;
- runner image and Node version;
- the operation, decision, and artifact names; and
- the final workflow conclusion.

The run should succeed and retain an artifact whose name includes run ID and
attempt. Download it and inspect `operation.json` and `decision.json`.

With GitHub CLI authenticated for the practice repository:

```bash
gh run list --workflow lab-maintenance-baseline.yml --limit 10 \
  --json databaseId,attempt,event,headSha,status,conclusion,createdAt,startedAt,updatedAt,url
gh run view RUN_ID --attempt 1 --verbose
gh run download RUN_ID --dir evidence/RUN_ID-attempt-1
```

Replace `RUN_ID` with the numeric database ID. Compare the structured CLI fields
with the web interface. Notice that artifact evidence is separate from logs and
that a job can preserve a true failure after earlier diagnostic steps used
`continue-on-error`.

## 3. Build a failure evidence matrix

Dispatch four more starter runs, one for each mode below. Do not rerun them yet.
For each run, capture the first divergent step, terminal conclusion, reason code,
whether target state changed, and whether a retry is demonstrably safe.

| Mode | Expected observation | Initial recovery decision |
| --- | --- | --- |
| `deterministic` | Invalid plan before a provider request | Fix the input or code; no retry |
| `transient-before-write` | Connection loss with no target record | Reconcile, then bounded retry is safe |
| `transient-after-write` | Response loss after state changed | Reconcile and accept the applied state; no duplicate write |
| `flaky` | Attempt one fails and a later attempt can pass | Preserve both attempts and investigate nondeterminism |

Use the earliest divergent node, not the final red step, as your starting point:

```bash
gh run view RUN_ID --attempt 1 --log-failed
gh run download RUN_ID --dir evidence/RUN_ID-attempt-1
```

For every case, classify the fault as deterministic, external transient,
uncertain write, or flake candidate. Then state what evidence would disprove
your classification. A classification without falsifiable evidence is only a
label.

## 4. Review the five operational anti-patterns

Read the review-only files under `fixtures/`:

1. `blind-rerun.yml.txt` retries without knowing whether a write happened;
2. `missing-always.yml.txt` loses diagnostics after the upstream failure;
3. `context-dump.yml.txt` exposes excessive and potentially sensitive context;
4. `issue-storm.yml.txt` creates a new issue on every failure; and
5. `runner-drift.yml.txt` relies on mutable runner and tool state without
   recording identities.

For each, write one causal chain in the form:

```text
trigger → missing control → misleading or unsafe behavior → durable impact
```

Propose the smallest control that breaks the chain. A useful answer for issue
storms, for example, includes a stable incident key and update/deduplication
policy—not merely a different notification channel.

## 5. Install the hardened reference workflow

Replace the starter with the reference workflow:

```bash
cp curriculum/advanced/02-debugging-and-operations/solutions/01-evidence-led-operations.yml \
  .github/workflows/lab-maintenance-operations.yml
git add .github/workflows/lab-maintenance-operations.yml
git commit -m "Harden maintenance operations lab"
git push
```

Before running it, predict the graph for each failure mode. Locate these design
decisions in the YAML:

- one stable idempotency key derived from run ID, unchanged by a rerun attempt;
- reconciliation after a failed operation;
- retry only when authoritative state says `safe_to_retry == true`;
- `always()` evidence collection after an upstream failure;
- artifact names containing run ID and attempt;
- a separate historical analysis job; and
- a stable `Required operations` job that inspects upstream conclusions.

Dispatch `none`. Confirm both evidence artifacts exist, the summaries identify
the run, and the stable required job succeeds.

## 6. Compare safe retry with uncertain-write reconciliation

Dispatch `transient-before-write`. The first operation should fail, the
reconciliation report should prove the idempotency key is absent, and the
bounded retry should apply the operation. Download the evidence and verify that
the original operation, reconciliation, retry, and terminal decision agree.

Next dispatch `transient-after-write`. The client should report a timeout, but
reconciliation should find the requested operation already applied. The retry
step must be skipped. The workflow should classify the state from authoritative
evidence instead of creating a duplicate effect.

Answer these questions from the artifacts:

1. Which file is the source of truth for the target state?
2. Which property makes the request deduplicable?
3. Why is a client timeout insufficient evidence for retry?
4. What additional production evidence would be needed if the provider's read
   API were eventually consistent?

## 7. Preserve and compare a flaky attempt

Dispatch `flaky`. Record the run ID and inspect attempt one. Then request a
rerun of failed work:

```bash
gh run rerun RUN_ID --failed
gh run watch RUN_ID --exit-status
gh run view RUN_ID --attempt 1 --log-failed
gh run view RUN_ID --attempt 2 --verbose
```

Download the artifacts for each available attempt separately. The run ID should
remain stable and the attempt should change. Do not conclude “the test is flaky”
from green attempt two alone. Compare source SHA, workflow ref, runner details,
inputs, action SHAs, operation reports, and timestamps. List at least three
alternative explanations a production investigator would eliminate, such as an
external recovery, image change, cache state, or rate-limit reset.

If a partial rerun does not reproduce every artifact or successful job from the
first attempt, record that as an evidence-retention constraint. The operation
guide must say how investigators retrieve both attempts.

## 8. Evaluate service health and cost

Return to `operations-fixture/data/run-history.json`. For one historical run,
recalculate its DAG critical path from dependencies and compare it with the sum
of job durations. Explain why optimizing a parallel non-critical job may reduce
runner minutes without reducing wall-clock latency.

Then propose production SLOs with explicit populations and windows for:

- expected schedule delivery;
- terminal and first-attempt success;
- queue p95 and execution p95;
- flake-candidate rate; and
- error-budget burn.

Define whether your denominator uses attempts or logical runs and how skipped,
cancelled, and missing scheduled executions are handled. Add one cost guardrail
for runner minutes or retry amplification. Avoid a single global target that
mixes pull requests, deployments, and scheduled maintenance with different
user expectations.

## 9. Write the incident decision

Using `data/incident-events.json` and the generated timeline, write a short
incident record containing:

- detection and recovery timestamps;
- impacted workflow and operation identity;
- first divergent node and failure classification;
- authoritative state before and after reconciliation;
- containment and recovery decision;
- evidence retained, access, and expiry;
- root cause versus contributing conditions;
- one code regression test and one operational control; and
- owner and due date for each action.

Do not use “rerun until green” as remediation. A robust action removes the cause,
adds detection, or narrows impact. If the evidence cannot establish causality,
state the uncertainty and the next evidence required.

## 10. Production upgrade review

Before adapting this pattern, decide who owns the workflow and service, where
telemetry is exported, how webhook deliveries are deduplicated, what evidence is
retained, and who may access it. For self-hosted runners, add image identity,
ephemeral lifecycle, runner-group boundaries, autoscaler and queue monitoring,
network policy, disk-pressure alerts, and `_diag` log collection. For schedules
that must execute within a guarantee, use an external scheduler and an
idempotent dispatch path; GitHub schedules can be delayed or dropped.

Keep automated recovery bounded by time, attempts, operation identity, and a
reconciliation rule. A rollback or recovered retry mitigates impact but must not
turn the original failed change into a false-green release signal.

## Completion evidence

You are done when you can provide:

- five run IDs covering healthy and injected failure modes;
- separate evidence for both attempts of the flaky run where available;
- a completed failure evidence matrix with falsifiable classifications;
- proof that pre-write failure retried and post-write uncertainty did not;
- the generated SLI report and incident timeline;
- a production SLO proposal with explicit denominators;
- an incident decision with owners and regression prevention; and
- cleanup confirmation for copied workflows and retained practice artifacts.

Return to the [technical chapter](../README.md), compare the
[reference solution](../solutions/README.md), or take the
[full knowledge check](../../../../quiz/).
