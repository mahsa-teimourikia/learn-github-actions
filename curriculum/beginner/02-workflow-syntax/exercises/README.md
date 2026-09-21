# Workflow lab: compile a release request into an evaluated job graph

This lab uses GitHub Actions as the syntax runtime. You will evolve a valid but
limited starter into a typed release-orchestration workflow, observe how GitHub
evaluates it, and diagnose failures that occur before and during runner work.

## Scenario

Northstar now needs a controlled release request for its `api`, `worker`, and
`web` components. Operators choose an environment, decide whether the run is a
dry run, and provide a JSON component list. The workflow must generate a test
matrix, validate each combination, check a Redis service, optionally use a job
container, and simulate release eligibility without contacting production.

## Safety boundary

- Use a fork or disposable practice repository.
- Keep `dry_run` enabled until the final comparison experiment.
- The completed workflow only prints a release simulation. Do not add cloud
  credentials or a real deployment command.
- Workflow runs consume Actions minutes and may pull the public Redis image.

## Run the fixture locally

```bash
cd curriculum/beginner/02-workflow-syntax/release-fixture
npm ci --ignore-scripts
npm test
TARGET_ENVIRONMENT=staging \
DRY_RUN=true \
COMPONENTS_JSON='["api","worker"]' \
npm run plan
```

The local path validates business inputs and matrix generation. Only a real
GitHub run can demonstrate event selection, context availability, matrix
expansion, job conditions, service-container lifecycle, and concurrency.

## Install the starter

Copy the starter to GitHub's discovery directory on a practice branch:

```bash
cp curriculum/beginner/02-workflow-syntax/exercises/01-release-orchestration-starter.yml \
  .github/workflows/lab-workflow-syntax.yml
```

Commit the copy, push it, and open a pull request. This uses the safe pull
request defaults. `workflow_dispatch` becomes available only after the workflow
exists on the practice repository's default branch.

## Baseline observation

Before editing, record:

- the displayed `run-name`;
- the event, ref, SHA, and actor;
- the number and names of matrix jobs;
- which jobs run in parallel;
- the effective token permission shown in the setup log; and
- whether a failed matrix child cancels its siblings.

## Exercise 1 — map the YAML document

Identify each top-level key and label when GitHub evaluates it:

1. `name` and `run-name` provide UI identity.
2. `on` decides whether a run exists.
3. `permissions`, `concurrency`, and `defaults` establish workflow policy.
4. `jobs` defines schedulable units.
5. Job keys define runner, dependencies, conditions, services, containers, and
   strategy.
6. Step keys define an action or shell command plus its inputs and environment.

Add a workflow-level `defaults.run.shell: bash`. Confirm that a job-level
working directory still overrides only the more specific setting.

## Exercise 2 — promote step outputs into a dynamic matrix

The `release_plan` step already writes compact values to `GITHUB_OUTPUT`.

1. Map `matrix`, `plan_id`, `should_release`, and `target_environment` through
   `jobs.plan.outputs`.
2. Replace the hard-coded matrix with:

   ```yaml
   matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}
   ```

3. Keep `needs: plan`; remove it temporarily and compare GitHub's validation
   feedback with [`missing-needs.yml.txt`](../fixtures/missing-needs.yml.txt).
4. Add `continue-on-error: ${{ matrix.experimental || false }}` at job level.

Run with `api`, `worker`, and `web`. Predict the expanded count before viewing
the graph. Explain the excluded combination and the experimental include value.

## Exercise 3 — keep expressions out of shell syntax

Inputs and event payload fields are data, not trusted shell source.

1. Keep expressions under `env`.
2. Quote every shell expansion.
3. Diagnose [`direct-interpolation.yml.txt`](../fixtures/direct-interpolation.yml.txt).
4. Compare `inputs.dry_run` with `github.event.inputs.dry_run` using
   [`string-boolean.yml.txt`](../fixtures/string-boolean.yml.txt). The `inputs`
   context preserves booleans; the event payload representation uses strings.

Use an issue title containing quotes and shell punctuation in a disposable test
workflow. The corrected workflow must print the exact title without executing
its content.

## Exercise 4 — add a service container and optional job container

Add an `integration` job that:

1. needs the plan;
2. declares `redis:7.4-alpine` under `services`;
3. includes a health check and publishes container port 6379;
4. passes `${{ job.services.redis.ports[6379] }}` through `env`; and
5. runs `npm run check:service`.

Then add a `container_check` job guarded by a typed boolean input. Run its steps
inside `node:24-bookworm-slim`. Record the differences between a job container
and a service container: execution location, networking, and purpose.

## Exercise 5 — conditions, conclusions, and concurrency

1. Add `simulate_release` with `needs: [plan, validate, integration]`.
2. Run it only for manual, non-dry-run requests whose plan output is `true`.
3. Give it `permissions: {}` and keep the operation a printed simulation.
4. Add a report job with `if: ${{ always() && !cancelled() }}` and job-level
   `needs` covering every earlier job.
5. Write only selected job conclusions to `GITHUB_STEP_SUMMARY`; never dump an
   entire context.
6. Add an environment-specific concurrency group with
   `cancel-in-progress: false` so the newest pending request waits rather than
   canceling an active request. Then compare this established behavior with the
   newer `queue: max` capability discussed in the chapter.

Use `always()` only for bounded reporting or cleanup. Do not use it to publish
after validation failed.

## Failure experiments

Run and record these cases:

| Case | Input/change | Expected evidence |
| --- | --- | --- |
| Baseline PR | Starter unchanged | Three matrix children; no release job |
| Dynamic plan | `api`, `worker`, `web` | Five children after one exclusion |
| Invalid JSON | `components_json=api,worker` | Plan fails before matrix creation |
| Unsupported component | `["billing"]` | Allowlist error in the plan step |
| Injected stable failure | `fail_component=api` | Required matrix child and `validate` fail |
| Experimental failure | `fail_component=web` | Experimental child fails without failing the matrix job |
| Dry run | `dry_run=true` | Release simulation is skipped |
| Release eligible | `dry_run=false` | Simulation runs; no external write occurs |
| Overlapping request | Dispatch twice for one environment | Newest request waits behind the active run |

## Evaluation record

For each case, record expected and observed:

- run creation and displayed name;
- expanded job count;
- job conclusion (`success`, `failure`, `skipped`, or `cancelled`);
- first relevant error or skip reason;
- summary content; and
- whether the outcome matched the declared safety boundary.

Completion requires 100% agreement for the nine labeled cases, zero external
writes, and an explanation for every skipped job. A green run alone is not
enough: an incorrectly skipped validation job can also produce green checks.

## Compare with the reference

After completing the experiments, compare your file with
[`01-release-orchestration.yml`](../solutions/01-release-orchestration.yml).
Differences are acceptable when you can explain context availability,
permissions, graph behavior, failure propagation, and resource cost.

## Completion evidence

Keep links to at least:

- one pull-request run;
- one dynamic manual run;
- one required matrix failure;
- one experimental failure;
- one release-eligible simulation; and
- your expected-versus-observed evaluation table.
