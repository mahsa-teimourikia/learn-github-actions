# Workflow lab: redesign monorepo CI from evidence

You will measure an all-services baseline, introduce dependency-aware selection,
extract a reusable `v1` service contract, and prove that the optimized graph is
both cheaper and correct. GitHub Actions is the lab runtime; local tests validate
the planner but cannot replace actual event, graph, artifact, or cancellation
evidence.

## Safety boundary

- Use a fork or disposable practice repository.
- Do not add repository, package, or cloud write permissions.
- Keep third-party changed-file actions out of the runnable path; the lab uses an
  owned, locally tested planner.
- The cache-poisoning file is diagnostic text. Do not install its unsafe
  `cache-mode: write` setting on pull requests.
- Remove temporary sleeps and intentional test failures after observing them.

## 1. Validate the fixture locally

```bash
cd curriculum/intermediate/01-workflow-design/monorepo-fixture
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run evaluate
CHANGED_FILES_JSON='["services/catalog/src/catalog.mjs"]' npm run plan
SERVICE=catalog npm run test:service
```

Before continuing, explain why the catalog scenario selects checkout, why a
documentation-only scenario selects nothing, and why an unmapped code path
selects everything.

## 2. Install and measure the baseline

```bash
cp curriculum/intermediate/01-workflow-design/exercises/01-baseline-monorepo-ci.yml \
  .github/workflows/lab-baseline-monorepo-ci.yml
```

Commit and push the copy. Open a pull request that changes only a file under
`docs/`. Record:

- workflow start and completion timestamps;
- the three matrix job start and completion timestamps;
- elapsed workflow time;
- sum of service-job execution time;
- critical path through the graph;
- queue time where visible; and
- the `Required CI` conclusion.

Repeat for a catalog source change. The baseline should schedule the same three
service jobs in both cases. This is the trustworthy but wasteful comparison.

## 3. Build the affected-service plan

Create a working copy of the selective caller:

```bash
cp curriculum/intermediate/01-workflow-design/solutions/01-selective-monorepo-ci.yml \
  .github/workflows/lab-selective-monorepo-ci.yml
```

Temporarily comment out the `service-ci` and `required-ci` jobs so only `plan`
runs. Study `service-graph.json` and `src/change-plan.mjs`, then implement or
verify these invariants:

1. paths are normalized, deduplicated, and sorted;
2. a service change includes every transitive dependent;
3. a shared-library or global-input change includes all consumers;
4. docs select no services;
5. an unknown path selects all services and marks the fail-safe;
6. the matrix is structured JSON, not hand-built YAML text; and
7. each selection has a reason in the job summary.

Run the six manual inputs below through `workflow_dispatch`:

| Case | `changed_files_json` | Expected services |
| --- | --- | --- |
| Docs | `["docs/operating-model.md"]` | none |
| Leaf | `["services/notifications/src/notify.mjs"]` | notifications |
| Dependency | `["services/catalog/src/catalog.mjs"]` | catalog, checkout |
| Shared | `["packages/shared/src/money.mjs"]` | all three |
| Global | `["package-lock.json"]` | all three |
| Unmapped | `["tools/generator/index.mjs"]` | all three, fail-safe true |

The expected-versus-observed selection must match all six cases before you use
the output to skip tests.

## 4. Compare path filters with a dependency graph

Inspect [`path-filter-required-check.yml.txt`](../fixtures/path-filter-required-check.yml.txt).
Answer these questions before changing any workflow:

1. What happens to a required check when no path matches?
2. Which glob would select checkout after a catalog change?
3. How would you keep that glob synchronized with the application dependency?
4. What is the consequence if a changed file appears outside every known glob?

Keep the planner workflow broadly triggered. Selection should happen inside the
graph so the stable aggregate check can still complete.

## 5. Extract the reusable service contract

Install the called workflow at the exact path referenced by the caller:

```bash
cp curriculum/intermediate/01-workflow-design/solutions/02-reusable-service-ci.yml \
  .github/workflows/lab-reusable-service-ci.yml
```

Restore the `service-ci` job in the caller. Explain which layer owns each item:

| Concern | Caller | Reusable workflow |
| --- | --- | --- |
| Event and tested change | yes | no |
| Concurrency and cancellation | yes | no |
| Affected-service matrix | yes | consumes one row |
| Runner and timeout | no | yes |
| Service allowlist | no | yes |
| Test command | no | yes |
| Report artifact contract | no | yes |
| Stable repository check | yes | no |

Dispatch the dependency case. Verify two calls to `Reusable service CI v1` and
two artifacts whose names contain service and commit SHA.

Change `contract-version: v1` to `v2`. The called workflow must reject the
unsupported contract before checkout. Restore `v1` and describe a migration
plan for a genuinely breaking `v2` input or output change.

## 6. Make empty selection and failure propagation explicit

Restore `required-ci`. Run the docs case and verify:

- `plan` succeeds;
- `service-ci` is skipped deliberately;
- `Required CI` exists and succeeds; and
- the summary reports zero selected services and three avoided jobs.

Then introduce a realistic required failure by changing
`services/notifications/src/notify.mjs` so its existing test fails. Dispatch the
notifications-only case. The reusable call and `Required CI` must both fail.
Restore the implementation and confirm the next run succeeds.

Compare that behavior with an aggregate job that uses `if: always()` but never
checks `needs.service-ci.result`. Explain why a green fan-in box would be a false
signal.

## 7. Observe stale-run cancellation

Add `sleep 90` immediately before the service test in your practice copy of the
reusable workflow. Push two commits quickly to the same pull request. Verify the
older run is cancelled and the newer run proceeds under the same concurrency
group.

Now change the group to a constant such as `ci`, start runs from two different
branches, and observe the unintended cross-branch interference. Restore the
workflow-plus-PR/ref key and remove the sleep.

Do not copy pull-request cancellation policy into deployment workflows without
an explicit idempotency and reconciliation design.

## 8. Inject planner failures

Run these controlled experiments on the practice branch:

| Failure | Change | Expected evidence | Mitigation |
| --- | --- | --- | --- |
| Missing history | Use the pattern in `shallow-history.yml.txt` | Diff cannot resolve an unavailable base in applicable histories | Fetch the required objects |
| Missing mapping | Add `tools/new-source.mjs` | All services; fail-safe true | Add owned mapping after review |
| Broken graph | Misspell a dependency | Labeled evaluation fails or impact is wrong | Graph schema and test cases |
| Malformed manual input | Set `changed_files_json` to `catalog` | Planner rejects non-JSON | Typed validation before outputs |
| Missing report | Remove report creation | Artifact upload fails | `if-no-files-found: error` |
| Contract drift | Caller requests `v2` | Contract validation fails early | Versioned release and migration |

For each case, record the first meaningful error, job conclusion, aggregate
conclusion, and whether the system failed safe.

## 9. Evaluate baseline versus selective CI

Use the six scenarios to complete this table with observed run data:

| Scenario | Expected set | Observed set | Exact? | Baseline jobs | Selective jobs | Jobs avoided | Elapsed | Runner-time sum |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Docs | none |  |  | 3 |  |  |  |  |
| Leaf | notifications |  |  | 3 |  |  |  |  |
| Dependency | catalog, checkout |  |  | 3 |  |  |  |  |
| Shared | all |  |  | 3 |  |  |  |  |
| Global | all |  |  | 3 |  |  |  |  |
| Unmapped | all |  |  | 3 |  |  |  |  |

Calculate exact-case rate, selection recall and precision for every non-empty
case, total jobs avoided, median elapsed time, and total service-job time. Do not
claim a cost reduction from estimates alone; label modeled and observed values.

## 10. Production design review

Write a short decision record covering:

- why an owned planner, a third-party changed-files action, or a build-system
  affected graph is appropriate for this repository;
- how the dependency graph is updated and reviewed;
- the full-validation backstop and acceptable false-negative target;
- reusable-contract ownership, release, deprecation, caller inventory, and
  rollback;
- cache read/write policy by event trust;
- concurrency behavior for CI versus deployment;
- runner capacity, queue-time objective, and cost attribution; and
- which repository or organization rules make `Required CI` enforceable.

## Completion evidence

Keep links to:

- one baseline docs run and one baseline catalog run;
- all six selective planner scenarios;
- one successful two-service reusable run and its artifacts;
- one required service failure and failed aggregate gate;
- the stale cancelled run and its replacement;
- the completed evaluation table; and
- the production decision record.

Finish the Hub checkpoint, then use the repository's full quiz to revisit cache,
artifact, and reuse boundaries.
