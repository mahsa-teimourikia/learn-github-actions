# Workflow lab: close an Actions attack graph

You will review six realistic vulnerable workflow shapes without executing them,
run deterministic policy and authorization tests, install a safe baseline, add
purpose-built security analysis, and produce evidence for a stable required
check. The repository and GitHub Actions service are the lab environment; no
notebook or simulated scheduler is used.

## Safety boundary

- Use a fork or disposable practice repository.
- Never copy `fixtures/vulnerable/*.yml.txt` into `.github/workflows` or remove
  the `.txt` suffix in a GitHub repository.
- Use GitHub-hosted runners only. Do not add secrets, OIDC permission, write
  permissions, cloud roles, registry publication, or production endpoints.
- Keep `harden-runner` in audit mode for this exercise.
- Do not print tokens, secrets, complete contexts, OIDC JWTs, or environment
  files. Workflow logs and artifacts may be visible to repository readers.
- Workflow runs, dependency review, artifacts, and hosted runners may consume
  repository quota.

## 1. Establish the deterministic baseline locally

```bash
cd curriculum/advanced/01-security-and-reliability/security-fixture
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run evaluate
```

Confirm the final JSON reports:

- six of six workflow cases match their expected findings;
- vulnerable fixtures total 81 teaching risk points;
- hardened fixtures have zero modeled findings and zero critical/high findings;
- all nine authorization cases match; and
- seven unsafe authorization requests are denied.

Open `reports/workflow-risk.json` and `reports/authorization.json`. Select one
case and trace the exact input, interpreter, authority, persistence, and side
effect. The score orders this course's labeled paths; it is not a production
severity calculator.

## 2. Install the safe starter

```bash
cp curriculum/advanced/01-security-and-reliability/exercises/01-security-gate-starter.yml \
  .github/workflows/lab-security-gate-starter.yml
```

Commit and push. Open a pull request that changes a file under the lesson. Record:

- event, actor, workflow ref, source SHA, and merge ref;
- the token permissions shown in the setup log;
- runner image and whether the workspace is fresh;
- the action commit SHAs visible in the workflow;
- results for tests, scenario evaluation, authorization evaluation, and the
  final `Required security` check; and
- the absence of secrets, OIDC permission, write authority, and external writes.

Explain why `persist-credentials: false` removes one ambient Git credential but
does not sandbox arbitrary code in the job.

## 3. Review—not execute—the vulnerable cases

For each file under `fixtures/vulnerable/`, fill this table before reading its
hardened partner:

| Case | Attacker-controlled input | Interpreter | Authority/persistence | Terminal impact | Architectural fix |
| --- | --- | --- | --- | --- | --- |
| Pwn request |  |  |  |  |  |
| Script injection |  |  |  |  |  |
| Privileged cache |  |  |  |  |  |
| Artifact confusion |  |  |  |  |  |
| Dependency drift |  |  |  |  |  |
| Retry storm |  |  |  |  |  |

Compare your answers with `fixtures/hardened/`. For every change, classify it as
prevention, least privilege, isolation, integrity evidence, detection, recovery,
or governance. Most strong designs use several classes.

## 4. Inject a regression safely

Edit only the hardened `.yml.txt` fixture for script injection. Move the PR title
expression from `env` directly into `run`, then execute:

```bash
npm test
npm run audit
```

The targeted unit test and scenario evaluation must fail. Restore the safe
fixture and confirm both pass. Next, add a new authorization case that requests
a production write from an unprotected branch. First make the expected result
incorrect and observe the failure; then encode the correct denial.

This experiment proves that the gate contains regression assertions, not only a
one-time scanner snapshot.

## 5. Measure pin and permission coverage

Review the runnable starter and count:

```text
immutable external uses / all external uses
jobs with explicit timeout / all jobs
jobs with only required token permissions / all jobs
checkout steps with persist-credentials false / all checkout steps
```

The starter should reach 100% for each applicable measure. Explain why this
still does not establish that the pinned source is benign or that every network
destination is authorized.

Run `actionlint` against the starter using your installed binary or the version
documented by this repository. Distinguish syntax/expression feedback from
security findings; neither replaces the other.

## 6. Install the hardened reference

Remove the starter workflow and install the completed gate:

```bash
rm .github/workflows/lab-security-gate-starter.yml
cp curriculum/advanced/01-security-and-reliability/solutions/01-hardened-security-gate.yml \
  .github/workflows/lab-hardened-security-gate.yml
```

Review every full SHA against its repository and release before committing. The
human-readable version comment is evidence for reviewers; the SHA is the
immutable reference.

The expected graph is:

```text
policy evaluation ─┐
zizmor ────────────┼─→ Required security
dependency review ─┘
```

On a pull request, all three upstream jobs must succeed. On `push` or manual
dispatch, dependency review is intentionally skipped and the final gate checks
for that exact state. Change one expected result in the final step and confirm a
green upstream graph can still be rejected by policy; then restore it.

## 7. Inspect real `zizmor` behavior

The reference pins the `zizmor-action` wrapper and the analyzer version
separately, disables online audits, uses the regular persona, and emits console
findings plus annotations without requiring GitHub Advanced Security.

Run the workflow and answer:

1. Which file was collected and why are vulnerable `.yml.txt` fixtures excluded?
2. What is the difference among regular, pedantic, and auditor personas?
3. Why does SARIF mode communicate findings without a finding-based process exit
   code, while console mode can act as a direct gate?
4. Which useful online audits are absent, and what additional token access would
   be needed for a private repository?
5. Who owns triage, suppressions, analyzer updates, and expired exceptions?

Optionally install the official `zizmor` CLI locally and scan a temporary copy of
one vulnerable fixture outside `.github/workflows`. Never commit the executable
copy. Compare its findings with the transparent teaching policy and document
true positives, different terminology, and gaps.

## 8. Exercise dependency review

Open a pull request that changes the fixture lockfile without adding a package;
confirm dependency review completes. If you have a safe, known test repository
and a documented non-production package case, propose a dependency change and
inspect the dependency diff. Do not intentionally introduce malware or publish
anything.

Record:

- ecosystem and direct/transitive changes;
- advisory severity and license evidence, if present;
- the configured failure threshold;
- repository/plan prerequisites; and
- why a clean dependency review does not prove an action or package is benign.

Compare dependency review with Dependabot alerts, Dependabot update PRs,
Scorecard, and an application vulnerability scanner. State when each runs and
what change or inventory it evaluates.

## 9. Analyze runtime egress evidence

Open the `harden-runner` step and its run evidence. List every observed network
destination and classify it as GitHub control plane, action distribution,
package registry, expected telemetry, or unexplained. Audit mode records; it
does not block.

Draft—but do not enable in this lab—an egress allowlist. Include an emergency
process for registry or GitHub endpoint changes. Explain the trade-off between a
tight list, build availability, mirrors, and incident response. Decide whether
the third-party runtime control belongs in untrusted jobs, privileged jobs, or
both, and account for the authority you grant to the control itself.

## 10. Add control-plane enforcement

In repository settings, inspect without weakening existing controls:

1. default `GITHUB_TOKEN` permission and whether Actions may create/approve PRs;
2. allowed actions and reusable workflows;
3. branch rules or rulesets protecting workflow changes and `Required security`;
4. CODEOWNERS coverage for workflows, actions, runner configuration, and policy;
5. Actions workflow execution protections and policy insights;
6. environment reviewers, deployment branches/tags, and bypass rules; and
7. dependency graph, code scanning for Actions, secret scanning, and audit log
   availability for the repository plan.

For Actions policies, use evaluate mode to inspect impact before enforcement.
Document every required exception with owner, reason, compensating control,
expiry, and removal signal. Do not claim a YAML control enforces a setting that
lives in GitHub's control plane.

## 11. Run failure and gate experiments

Perform these safe changes one at a time and restore each afterward:

| Experiment | Expected upstream result | Expected final gate |
| --- | --- | --- |
| Break a policy unit test | policy fails | fails |
| Reintroduce a mutable action ref in installed lab | `zizmor` fails or reports according to mode | fails in console gate mode |
| Manual dispatch | dependency review skipped | succeeds if other jobs succeed |
| Pull request with clean dependency diff | dependency review succeeds | succeeds |
| Cancel a running workflow | one or more jobs cancelled | no false-green required result |
| Remove generated reports before upload | policy job fails on missing evidence | fails |

If the analyzer's behavior differs, preserve the log, record the pinned version,
classify the difference, and update the assertion only after understanding it.
Never use `continue-on-error` to make an unexplained security finding green.

## 12. Complete the security evaluation record

| Dimension | Baseline | Hardened | Evidence |
| --- | ---: | ---: | --- |
| Labeled cases exact |  | 6/6 |  |
| Modeled risk points | 81 | 0 |  |
| Critical/high findings |  | 0 |  |
| Authorization decisions exact |  | 9/9 |  |
| Unsafe authorization requests denied |  | 7/7 |  |
| Immutable external references |  | 100% |  |
| Applicable security jobs enforced |  | 100% |  |
| Unexpected egress destinations |  | 0 or owned exceptions |  |

Then write a one-page production decision covering:

- untrusted events and actor policy;
- token, secret, OIDC, and environment authority;
- action/reusable-workflow inventory, pins, update review, and exceptions;
- cache modes, artifact trust, provenance, and retention;
- hosted/self-hosted runner isolation, lifecycle, and network policy;
- required checks, CodeQL/`zizmor`/dependency-review ownership, and suppression
  expiry;
- publication idempotency, reconciliation, concurrency, and rollback;
- audit evidence, detection, containment, credential rotation, and runner/cache/
  artifact invalidation; and
- policy rollout, break-glass authority, testing, and periodic reassessment.

## Completion evidence

Keep links or artifacts for:

- one starter run and one hardened run;
- `workflow-risk.json` and `authorization.json`;
- the injected-regression failure and restored success;
- `actionlint`, `zizmor`, and dependency-review results;
- the final gate on pull request and manual-dispatch paths;
- reviewed runtime destinations and draft allowlist;
- completed attack-path and evaluation tables; and
- the production security decision.

Finish the Hub checkpoint and the Security & Reliability category of the full
quiz. Continue to [Debugging and operations](../../02-debugging-and-operations/README.md)
to investigate failed runs and security incidents from retained evidence.
