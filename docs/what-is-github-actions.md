# What is GitHub Actions?

GitHub Actions is GitHub's workflow automation platform for CI/CD and repository operations. A workflow is a YAML document stored in `.github/workflows/` that runs when an event occurs, when a person starts it, or on a schedule.

GitHub's [workflow documentation](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows) describes a workflow as one or more jobs, with each job executing steps on a runner. The core model is:

```text
event → workflow → jobs → runner → steps → result
```

## The pieces

### Event

An event makes a workflow eligible to run. Examples include `push`, `pull_request`, `workflow_dispatch`, `schedule`, `release`, `workflow_call`, and `workflow_run`. The [events reference](https://docs.github.com/en/actions/reference/events-that-trigger-workflows) is the source of truth for activity types and payloads.

### Workflow

The YAML file declares triggers, permissions, environment variables, concurrency, and jobs:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

### Job

A job is a group of steps that runs on one runner. Jobs are isolated unless data is passed through outputs, artifacts, caches, or an external store. Use `needs` to define ordering; without it, independent jobs can run in parallel.

### Runner

A runner is the machine that executes a job. GitHub-hosted runners are fresh, temporary virtual machines. A self-hosted runner is infrastructure you maintain. Assume no state survives between jobs. Treat self-hosted runners as privileged infrastructure because persistent workspaces and network access can leak between jobs.

### Step

A step runs shell commands or invokes an action:

```yaml
steps:
  - name: Run a command
    run: npm test
  - name: Store a report
    uses: actions/upload-artifact@v4
    with:
      name: test-results
      path: test-results/
```

Actions are reusable extensions. A `run` block is still code with the runner's permissions and must be reviewed accordingly.

## Data flow

| Mechanism | Purpose | Lifetime | Do not use it for |
| --- | --- | --- | --- |
| Step output | Small value within a job | Current job | Large files |
| Job output | Small value across dependent jobs | Workflow run | Unbounded logs |
| Artifact | Files to retain or pass between jobs | Configurable retention | Dependency cache |
| Cache | Reusable dependency/build data | Cache policy | Releases or secrets |
| Secret | Credential material | Repository/environment scope | General configuration |
| Variable | Non-sensitive configuration | Repository/environment scope | Passwords |

## Trust boundaries

A pull request from a fork may contain arbitrary workflow code, scripts, tests, dependencies, and Dockerfiles. Keep validation jobs read-only and avoid exposing secrets.

Be especially careful with `pull_request_target`: it runs in the base repository's context and may access secrets, but checking out and executing untrusted pull-request code can create a privilege-escalation path. Use it only for narrowly reviewed metadata operations.

## Lifecycle

```text
1. GitHub receives an event
2. Trigger filters decide whether the workflow runs
3. GitHub evaluates the workflow and creates jobs
4. Runners execute jobs and steps
5. Logs, outputs, artifacts, and deployment records are produced
6. Branch protection or environments decide whether work can proceed
```

## First design questions

1. What event should start the workflow?
2. What code is trusted for that event?
3. Which jobs can run in parallel?
4. What permissions does each job need?
5. What is the artifact or state handoff?
6. What should happen on retry or cancellation?
7. Which environment or approval protects side effects?
8. How will an operator debug and reproduce a failure?

## Sources

- [GitHub — Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [GitHub — Quickstart](https://docs.github.com/en/actions/get-started/quickstart)
- [GitHub — Events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [GitHub — Secure use](https://docs.github.com/en/actions/reference/security/secure-use)
