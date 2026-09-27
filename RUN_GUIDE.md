# Run guide

This guide separates four activities that are easy to confuse:

1. reading the hosted Learning Hub;
2. validating the course repository locally;
3. running deterministic lesson fixtures locally; and
4. installing a starter workflow in a practice fork to observe real GitHub
   events, runners, checks, logs, artifacts, and reruns.

Complete the [installation guide](INSTALLATION.md) first if you want to run
anything locally or on GitHub.

## Fastest path: use the hosted course

Open the [GitHub Actions Learning Hub](https://mahsa-teimourikia.github.io/learn-github-actions/).
Choose a level and work through each lesson's **Learn → Lab → Checkpoint** tabs.
Progress is stored in that browser's local storage; it is not sent to a server
and does not synchronize across browsers.

Use the [full knowledge check](https://mahsa-teimourikia.github.io/learn-github-actions/quiz/)
after each level. No login, local runtime, or API key is required for this path.

## Run the complete repository validation

From the repository root:

```bash
npm test
```

No root `npm install` or `npm ci` is required. The command runs:

| Stage | What it proves |
| --- | --- |
| Quiz tests | 21 questions remain valid, balanced, and exactly graded |
| Python tests | Lesson fixtures and course-specific technical contracts pass |
| Learning validation | Six lessons, workflow labs, and local Markdown links have the expected structure |
| Pages build and smoke test | Hub, lesson registry, brand asset, and quiz package correctly |

GNU Make users can run the same complete path with:

```bash
make test
```

Useful focused commands are:

```bash
npm run test:quiz
npm run test:python
npm run test:learning
npm run test:pages
python3 scripts/validate_learning.py --links
python3 scripts/validate_learning.py --workflows
```

Run focused checks during editing and the full suite before opening a pull
request. A local pass validates deterministic repository contracts; it does not
replace a GitHub-hosted workflow run.

## Preview the Learning Hub locally

Build the static output:

```bash
npm run build:pages
```

Serve it through HTTP rather than opening `site/index.html` directly:

```bash
python3 -m http.server 8000 --directory site
```

Open [http://localhost:8000](http://localhost:8000). Confirm that:

- all six lessons appear;
- level filters work;
- Learn, Lab, and Checkpoint tabs render;
- completion state persists after refresh;
- the Install and Run guide navigation links open; and
- the full quiz loads at `/quiz/`.

Stop the server with `Ctrl+C`. If port 8000 is already occupied, choose another
port, such as 8080, and open the matching URL.

## Run one lesson fixture locally

Local fixtures model application logic and evidence without GitHub credentials.
Each fixture owns a lockfile. Enter only the fixture you want, install exactly
its locked dependencies, then run its scripts.

| Lesson fixture | Commands after entering the directory |
| --- | --- |
| Actions foundations — `curriculum/beginner/01-actions-foundations/sample-app` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · `npm run build` · `npm run verify:dist` |
| Workflow syntax — `curriculum/beginner/02-workflow-syntax/release-fixture` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · follow the lab for typed plan inputs |
| Workflow design — `curriculum/intermediate/01-workflow-design/monorepo-fixture` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · `npm run evaluate` |
| Deployment patterns — `curriculum/intermediate/02-deployment-patterns/release-fixture` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · `npm run evaluate` |
| Security and reliability — `curriculum/advanced/01-security-and-reliability/security-fixture` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · `npm run evaluate` |
| Debugging and operations — `curriculum/advanced/02-debugging-and-operations/operations-fixture` | `npm ci --ignore-scripts --no-audit --no-fund` · `npm test` · `npm run evaluate` |

For example:

```bash
cd curriculum/advanced/02-debugging-and-operations/operations-fixture
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run evaluate
```

Read the lesson lab before changing input variables or invoking side-effect
simulation scripts. The fixtures are safe local models, but their commands still
encode scenario order and expected state.

### Run the actionlint workshop

Install the verified analyzer using the
[workshop instructions](curriculum/beginner/02-workflow-syntax/actionlint-workshop/README.md#install-a-known-release),
then from its directory run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
ACTIONLINT_BIN=/absolute/path/to/actionlint npm run verify
```

The result should report the expected analyzer version, six of six broken cases
detected, and a clean reference workflow. Files under the workshop's `fixtures/`
directory end in `.yml.txt`; never copy them into `.github/workflows`.

## Run a real workflow lab safely

Use a fork or disposable repository. Real runs are necessary because a local
script cannot reproduce GitHub event payloads, expression timing, runner
allocation, token permissions, checks, artifacts, environment rules, or rerun
attempts.

### 1. Create a practice branch

```bash
git switch -c learning/actions-foundations
```

Use a new branch for each lesson so workflow and fixture changes remain easy to
review and remove.

### 2. Read the safety boundary

Open the lesson README and `exercises/README.md`. Identify:

- the trigger and source revision;
- expected permissions;
- runner type;
- inputs and failure modes;
- artifact or state paths;
- any simulated side effect; and
- cleanup instructions.

Do not add secrets, cloud credentials, OIDC, self-hosted runners, production
endpoints, or write permissions unless the lesson explicitly defines a safe,
isolated exercise. Never install review-only `.yml.txt` fixtures.

### 3. Copy the lesson starter

Every lesson guide provides its exact command. The general shape is:

```bash
mkdir -p .github/workflows
cp curriculum/LEVEL/LESSON/exercises/STARTER.yml \
  .github/workflows/lab-LESSON.yml
```

Use a distinct `lab-*.yml` name so cleanup does not overwrite repository-owned
validation or Pages workflows.

### 4. Commit and push

```bash
git add .github/workflows/lab-LESSON.yml
git commit -m "Add practice workflow for LESSON"
git push --set-upstream origin learning/actions-foundations
```

Open a pull request **inside your fork**, from the practice branch to the fork's
default branch. Pull-request-triggered starters can now create checks without
changing the upstream course.

### 5. Handle manual-dispatch labs correctly

GitHub only accepts `workflow_dispatch` when the workflow file exists on the
default branch. For a new manual-only lab in a disposable fork:

1. review the copied workflow;
2. merge or commit the workflow-only file to the fork's default branch;
3. keep scenario/source changes on a separate practice branch;
4. dispatch the default-branch workflow and select the intended `--ref` where
   the lesson supports it; and
5. remove the lab workflow from the fork's default branch after completion.

Do not merge practice workflows into the upstream repository merely to make the
Run workflow button appear. Scheduled workflows also run from the default
branch and can be delayed; use the manual trigger for course experiments when
the lesson provides one.

See GitHub's [manual workflow guide](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
for current platform behavior.

### 6. Trigger and inspect the run

In the GitHub interface, open **Actions**, select the lab workflow, then inspect:

- event, actor, branch/ref, source SHA, workflow ref, run ID, and attempt;
- graph ordering, skipped jobs, matrices, and dependency edges;
- runner image and tool versions in setup output;
- token permissions and absence of unexpected secrets;
- first failed or divergent step rather than only the final error;
- summaries, annotations, artifacts, and checksums; and
- final job and workflow conclusions.

Record the evidence requested by the lesson before changing the workflow.

## Use GitHub CLI for run operations

After `gh auth login --web`, confirm the current fork:

```bash
gh repo view --json nameWithOwner,url
gh workflow list
```

Dispatch an eligible manual workflow and choose a ref:

```bash
gh workflow run lab-LESSON.yml --ref BRANCH
```

Add lesson-specific inputs with `-f key=value`. The workflow file must define
`workflow_dispatch`, and it must be registered from the default branch.

List and inspect runs:

```bash
gh run list --workflow lab-LESSON.yml --limit 10 \
  --json databaseId,attempt,event,headSha,status,conclusion,url
gh run view RUN_ID --verbose
gh run view RUN_ID --log-failed
gh run watch RUN_ID --exit-status
gh run download RUN_ID --dir evidence/RUN_ID
```

For rerun experiments, specify attempts when reviewing evidence:

```bash
gh run view RUN_ID --attempt 1 --log-failed
gh run view RUN_ID --attempt 2 --verbose
```

Do not print authentication tokens or complete contexts while capturing terminal
output. The [`gh workflow run`](https://cli.github.com/manual/gh_workflow_run)
and [`gh run`](https://cli.github.com/manual/gh_run) manuals document current
options.

## Recommended course order

| Order | Lesson | Run focus |
| ---: | --- | --- |
| 1 | [Actions foundations](curriculum/beginner/01-actions-foundations/README.md) | Event/ref identity, isolated jobs, artifacts, failure evidence |
| 2 | [Workflow syntax](curriculum/beginner/02-workflow-syntax/README.md) | Typed inputs, expressions, outputs, matrices, containers, static analysis |
| 3 | [Workflow design](curriculum/intermediate/01-workflow-design/README.md) | Selective monorepo graph, reusable contracts, cost and critical path |
| 4 | [Deployment patterns](curriculum/intermediate/02-deployment-patterns/README.md) | Immutable release identity, canary evidence, reconciliation, rollback |
| 5 | [Security and reliability](curriculum/advanced/01-security-and-reliability/README.md) | Attack paths, authorization cases, policy and fail-closed gates |
| 6 | [Debugging and operations](curriculum/advanced/02-debugging-and-operations/README.md) | Attempts, failure classification, SLOs, uncertain writes, incident timeline |

Complete the lesson's checkpoint after the lab and the full quiz after each
level. Do not copy a reference workflow before recording your baseline and
repair decisions.

## Clean up a practice lab

Remove only the workflow files you copied:

```bash
git rm .github/workflows/lab-LESSON.yml
git commit -m "Remove completed practice workflow"
git push
```

Then:

- close or merge the cleanup pull request in your fork;
- delete the named practice branch when no longer needed;
- remove downloaded local evidence if it contains repository metadata;
- let artifacts expire or delete them according to the lesson's retention
  guidance; and
- confirm the lab workflow no longer appears as active on the fork's default
  branch.

Do not delete repository-owned validation, Pages, or security workflows.

## Troubleshooting runs

### No run appears

Check workflow syntax, file location under `.github/workflows/`, trigger and
activity type, branch/path filters, default-branch presence, fork Actions state,
and repository policy. Run local learning validation and `actionlint` first.

### The Run workflow button is missing

Confirm that the workflow defines `workflow_dispatch` and exists on the fork's
default branch. A new workflow present only on a topic branch is not sufficient.

### A pull-request workflow is skipped

Inspect branch/path filters and activity types. Also check whether a failed or
skipped prerequisite caused downstream jobs to skip.

### A workflow cannot use an action

The repository or organization may restrict allowed actions or require full-SHA
pins. Preserve the policy and use a personal disposable fork when permitted;
do not weaken organization controls for a course lab.

### Artifacts or logs are missing

Confirm the run attempt, artifact name, retention window, and whether evidence
steps use `always()` appropriately. Partial reruns can split evidence across
attempts.

### Local tests pass but GitHub fails

Compare source SHA, workflow revision, runner image, environment, shell, action
SHAs, permissions, event payload, and external/service availability. Local
fixtures validate logic; GitHub validates platform behavior.

For reporting a reproducible course problem, follow [SUPPORT.md](SUPPORT.md) and
include operating system, runtime versions, the exact command, the first
relevant error, and the lesson path—never include secrets or tokens.
