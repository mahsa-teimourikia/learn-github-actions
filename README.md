# ✨ Learn GitHub Actions ✨

> A self-contained learning path for designing, writing, debugging, securing, and operating GitHub Actions workflows.

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-learning%20path-2088FF?logo=githubactions&logoColor=white)](https://docs.github.com/en/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

GitHub Actions is GitHub's automation platform for CI/CD and repository automation. A workflow is a YAML file in `.github/workflows/`; events trigger jobs, jobs run on runners, and steps execute commands or reusable actions. This repository teaches the mental model first, then provides complete scenario recipes you can copy and adapt.

The examples use readable major-version references. For production, follow the [secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use) and pin third-party actions to reviewed full-length commit SHAs.

## Contents

- [Start here](#start-here)
- [Visual model](#visual-model)
- [Learning path](#learning-path)
- [Scenario cookbook](#scenario-cookbook)
- [Core concepts](#core-concepts)
- [Guidelines and conventions](#guidelines-and-conventions)
- [Reusable code snippets](#reusable-code-snippets)
- [Security and reliability](#security-and-reliability)
- [Debugging and operations](#debugging-and-operations)
- [Interactive knowledge check](#interactive-knowledge-check)
- [Official documentation](#official-documentation)

## Start here

1. Read [What is GitHub Actions?](docs/what-is-github-actions.md) to learn the event → workflow → job → runner → step model.
2. Work through [Workflow syntax](docs/workflow-syntax.md), then create a small CI workflow in a test repository.
3. Pick a scenario from the [cookbook](#scenario-cookbook) and copy the matching example.
4. Add explicit permissions, concurrency, timeouts, caching, and artifact retention.
5. Learn how to debug failures and secure untrusted pull requests before adding deployment credentials.
6. Take the [interactive knowledge check](https://mahsa-teimourikia.github.io/learn-github-actions/) to test your understanding.

## Visual model

![GitHub Actions execution model from event to workflow, jobs, runners, steps, artifacts, and environments](assets/actions-flow.svg)

<sub>Diagram source: [Mermaid](assets/actions-flow.mmd).</sub>

```text
event → workflow → jobs → runner → steps → outputs/artifacts/deployment
```

The execution model is simple. The engineering decisions are in event filters, permissions, matrices, reusable workflows, environments, and safe boundaries around untrusted code.

## Learning path

### 1. Foundations

- [What is GitHub Actions?](docs/what-is-github-actions.md)
- [Workflow syntax](docs/workflow-syntax.md)
- Official [quickstart](https://docs.github.com/en/actions/get-started/quickstart)
- Official [workflow concepts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)

### 2. Build useful workflows

- [Scenario cookbook](docs/scenarios.md)
- [Core concepts](docs/core-concepts.md)
- [Workflow commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions)
- [Contexts and expressions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)

### 3. Reuse and scale

- [Reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Composite actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action)
- [Matrix strategies](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

### 4. Deploy and operate safely

- [Security and reliability](docs/security-and-reliability.md)
- [Debugging and operations](docs/debugging-and-operations.md)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)

## Scenario cookbook

| Scenario | Example | Key ideas |
| --- | --- | --- |
| Run tests on every pull request | [Node CI](examples/ci-node.yml) | `pull_request`, setup, cache, test, artifact |
| Test runtimes and operating systems | [Matrix CI](examples/matrix-ci.yml) | `strategy.matrix`, `fail-fast`, `include` |
| Validate a monorepo selectively | [Path filters](examples/path-filtered-ci.yml) | `paths`, job conditions, changed scope |
| Share one organization-standard pipeline | [Reusable workflow](examples/reusable-ci.yml) | `workflow_call`, inputs, secrets, outputs |
| Publish a release artifact | [Release workflow](examples/release.yml) | tags, artifacts, release permissions |
| Deploy with approvals | [Environment deployment](examples/environment-deployment.yml) | environments, reviewers, concurrency |
| Deploy without long-lived cloud keys | [OIDC deployment](examples/oidc-deployment.yml) | `id-token: write`, trust conditions |
| Build once and promote the same artifact | [Build and promote](examples/build-and-promote.yml) | artifact handoff, immutable output |
| Run maintenance on a schedule | [Scheduled workflow](examples/scheduled-maintenance.yml) | `schedule`, idempotency, observability |
| Respond to manual requests | [Manual dispatch](examples/manual-dispatch.yml) | typed inputs, approvals, safe defaults |
| Publish a static site | [Pages deployment](examples/pages-deployment.yml) | artifact upload, Pages deployment |
| Add security scanning | [Security scan](examples/security-scan.yml) | permissions, SARIF, PR boundaries |

## Core concepts

### Events

Events decide when a workflow is eligible to run. Common triggers include `push`, `pull_request`, `workflow_dispatch`, `workflow_call`, `schedule`, `release`, and `workflow_run`. Use filters to reduce noise and risk:

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - "src/**"
      - "package.json"
      - "package-lock.json"
```

### Jobs and dependencies

Jobs are isolated execution units. Use `needs` to express dependencies and pass small, explicit outputs between jobs:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.meta.outputs.name }}
    steps:
      - id: meta
        run: echo "name=app-${GITHUB_SHA}" >> "$GITHUB_OUTPUT"
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy ${{ needs.build.outputs.artifact-name }}"
```

### Caches and artifacts

Caches speed up deterministic dependency downloads; artifacts preserve build output or pass files between jobs. Build once, then promote the same immutable artifact. Never use either mechanism for secrets.

### Environments

Environments group deployment variables and protection rules such as required reviewers, wait timers, and branch restrictions. Put production jobs behind an environment; do not implement approval with a shell prompt.

## Guidelines and conventions

1. Name workflows by outcome: `CI`, `Deploy production`, or `Nightly maintenance`.
2. Keep triggers narrow; start with the smallest event and path filter that meets the requirement.
3. Begin with `permissions: { contents: read }`, then add only what a job needs.
4. Pin third-party actions to a reviewed full commit SHA in production.
5. Set `timeout-minutes` on jobs and long-running commands.
6. Use `concurrency` for deployments: cancel stale previews and serialize production.
7. Separate build and deploy so tests do not receive production credentials.
8. Pass artifacts rather than relying on workspace state across jobs.
9. Make writes idempotent; retries must not publish or migrate twice.
10. Treat fork pull requests as hostile; never expose secrets to untrusted code.
11. Prefer OIDC to long-lived cloud keys.
12. Log useful metadata, not secrets or complete secret-bearing contexts.
13. Test workflows like code with YAML linting, expression validation, and a real run.
14. Document repository settings, environments, variables, secrets, and branch rules.

## Reusable code snippets

### Least-privilege baseline

```yaml
permissions:
  contents: read
```

### Cache Node dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
- run: npm ci
```

### Upload and download an artifact

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: dist-${{ github.sha }}
    path: dist/
    if-no-files-found: error

- uses: actions/download-artifact@v4
  with:
    name: dist-${{ github.sha }}
    path: dist/
```

### Serialize production deployments

```yaml
concurrency:
  group: production
  cancel-in-progress: false
```

### Emit a step output safely

```yaml
- id: version
  run: echo "value=$(node -p 'require(\"./package.json\").version')" >> "$GITHUB_OUTPUT"
- run: echo "Version ${{ steps.version.outputs.value }}"
```

## Security and reliability

Read [Security and reliability](docs/security-and-reliability.md) before adding secrets or deployment jobs. The short version:

- default `GITHUB_TOKEN` to read-only;
- grant write permissions only to the job that needs them;
- pin third-party actions to reviewed SHAs;
- keep secrets out of fork-triggered code paths;
- use environments for production approvals;
- use OIDC instead of long-lived cloud credentials;
- isolate self-hosted runners;
- validate shell inputs and avoid interpolating untrusted values into `run:`; and
- retain logs, artifacts, provenance, and run metadata to investigate failures.

## Debugging and operations

When a workflow fails: identify the event and commit, read the first failing step, check contexts and permissions, reproduce the command locally, add targeted debug logging without secrets, and determine whether the failure is deterministic, flaky, or external. See [Debugging and operations](docs/debugging-and-operations.md).

## Interactive knowledge check

Take the [GitHub Actions Knowledge Check](https://mahsa-teimourikia.github.io/learn-github-actions/)—18 multiple-answer questions covering workflow structure, events, expressions, reuse, artifacts, deployment, and security. The quiz grades exact answer sets, reports topic scores, shows explanations on request, and saves progress only in the browser.

## Official documentation

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Quickstart](https://docs.github.com/en/actions/get-started/quickstart)
- [Workflow concepts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [Workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [Contexts](https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs)
- [Expressions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)
- [Reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Composite actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action)
- [Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [Secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- [Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
- [Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners)

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), prefer official GitHub documentation, and include a complete scenario or focused explanation with a runnable example.

## License

This repository is licensed under the [MIT License](LICENSE).
