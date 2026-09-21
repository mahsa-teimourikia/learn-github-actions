# Workflow syntax, explained

## Lesson outcomes

By the end of this lesson, you can author a valid workflow trigger, set least-privilege permissions, connect dependent jobs, use expressions safely, and explain matrix and concurrency controls.

**Prerequisite:** [Actions foundations](../01-actions-foundations/README.md).

**Scenario:** an operator needs a manually triggered deployment request with typed inputs and a safe default. Use [`manual-dispatch.yml`](manual-dispatch.yml) as the workflow lab: copy it into `.github/workflows/` on a practice branch, run it with several input combinations, and inspect the evaluated contexts and job conditions.

**Success criteria:** distinguish configuration, secrets, outputs, and artifacts; avoid direct shell interpolation of untrusted event data; and justify every elevated permission. The lesson does not configure a real production environment.

This is a practical tour of the YAML fields used most often in GitHub Actions. For exact grammar, use the [workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Minimal valid workflow

```yaml
name: Minimal CI

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello from GitHub Actions"
```

## `on`

The trigger can be a string, list, or mapping with filters:

```yaml
on:
  push:
    branches: [main]
    paths-ignore: ["docs/**"]
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      environment:
        description: Deployment target
        required: true
        type: choice
        options: [staging, production]
```

Avoid broad triggers until you know the cost and trust model. `paths` and `branches` filters are correctness and cost controls.

## `permissions`

Set a restrictive default, then elevate only the job that needs it:

```yaml
permissions:
  contents: read

jobs:
  publish:
    permissions:
      contents: read
      packages: write
```

`id-token: write` allows requesting an OIDC token; it does not grant general repository write access.

## `env`, `vars`, and `secrets`

- `env` is YAML configuration at workflow, job, or step scope.
- `vars` stores non-sensitive repository, organization, or environment configuration.
- `secrets` stores sensitive values and is masked in common log output.

Never use secrets as ordinary configuration or print a whole context while debugging.

## Jobs, dependencies, and outputs

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      should-deploy: ${{ steps.decision.outputs.should-deploy }}
    steps:
      - id: decision
        run: echo "should-deploy=true" >> "$GITHUB_OUTPUT"

  deploy:
    needs: prepare
    if: needs.prepare.outputs.should-deploy == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
```

If a dependency fails, downstream jobs are skipped unless you explicitly use a condition such as `always()`. Use that function carefully; cleanup can be useful, but publishing after failure is dangerous.

## Matrix strategies

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [20, 22]
```

Use `include` for exceptional combinations, `exclude` for unsupported ones, and `max-parallel` when fan-out is expensive.

## Conditions and expressions

Conditions use expressions:

```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Useful functions include `success()`, `failure()`, `cancelled()`, `always()`, `contains()`, `startsWith()`, `format()`, and `fromJSON()`.

Do not inject an untrusted expression directly into a shell command:

```yaml
# Risky: issue titles can contain shell syntax.
- run: echo "${{ github.event.issue.title }}"

# Safer: pass it as an environment value and quote the expansion.
- env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
  run: printf '%s\n' "$ISSUE_TITLE"
```

## Concurrency

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

For production, use `cancel-in-progress: false` to queue deployments rather than canceling an active release.

## `uses` and action versions

Major tags are readable for learning; full commit SHAs are stronger for production supply-chain control:

```yaml
- uses: actions/checkout@v4
- uses: actions/checkout@<reviewed-full-commit-sha> # v4
```

## `run` and shell behavior

Each `run` step starts a new process. Use a multiline block for related commands and fail fast:

```yaml
- name: Build
  shell: bash
  run: |
    set -Eeuo pipefail
    npm ci
    npm run build
```

Write values to special files instead of deprecated command syntax:

```bash
echo "name=artifact-${GITHUB_SHA}" >> "$GITHUB_OUTPUT"
echo "built=true" >> "$GITHUB_ENV"
```

## Reusable workflow interface

```yaml
on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: "22"
    secrets:
      npm-token:
        required: true
```

Keep the interface small. Treat a reusable workflow like a versioned API and document permissions, secrets, outputs, and side effects.

## YAML pitfalls

- YAML indentation changes meaning; use two spaces consistently.
- `on` is a trigger mapping, not a job.
- `needs` refers to job IDs, not display names.
- Context availability depends on the workflow key and event.
- Matrix values can be numbers or strings; normalize them when comparing expressions.
- Workflow files must live under `.github/workflows/` and use `.yml` or `.yaml`.

## Sources

- [Workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Contexts reference](https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs)
- [Expressions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)
- [Workflow commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions)
