# Core concepts and design choices

## Lesson outcomes

By the end of this lesson, you can select triggers from the trust boundary, choose cache versus artifact, decide between reusable workflows and composite actions, and design bounded matrix fan-out.

**Prerequisites:** complete the [Beginner track](../../beginner/README.md) or be comfortable with workflow syntax and expressions.

**Scenario:** a growing repository needs cross-platform tests, monorepo path filters, and one versioned CI contract shared by several callers. Study [`matrix-ci.yml`](matrix-ci.yml), [`path-filtered-ci.yml`](path-filtered-ci.yml), [`reusable-ci.yml`](reusable-ci.yml), and [`call-reusable-ci.yml`](call-reusable-ci.yml).

**Success criteria:** choose an appropriate reuse boundary, identify hidden matrix cost, and make data handoffs explicit. Install the lesson-owned workflow examples on a practice branch, compare their run graphs and durations, and explain the trade-offs from observed evidence.

## Events: choose the trust boundary first

The same code can be safe or unsafe depending on the event that runs it. A protected-branch push runs code maintainers accepted. A fork pull request may run arbitrary contributor code.

| Trigger | Typical use | Secret posture |
| --- | --- | --- |
| `push` | CI after accepted commits | Safe for protected branches, with scoped permissions |
| `pull_request` | Validate branch and fork changes | No secrets; treat code as untrusted |
| `pull_request_target` | Label or inspect PR metadata | Base-repo privileges; never execute PR code blindly |
| `workflow_dispatch` | Operator-controlled operation | Validate inputs and use environments |
| `schedule` | Recurring maintenance | Idempotent and observable |
| `workflow_call` | Shared workflow | Versioned interface and explicit secrets |
| `workflow_run` | Follow-up after another workflow | Verify conclusions and artifact provenance |

## Contexts and data flow

Common contexts include `github` (event and repository metadata), `runner` (machine details), `matrix`, `needs`, `steps`, `inputs`, `vars`, and `secrets`. The [contexts reference](https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs) lists availability by workflow key.

## Caches versus artifacts

```text
cache: dependency inputs → faster future jobs
artifact: job output → inspect, download, or promote
```

Cache keys should include lockfile hashes or equivalent dependency identity. Artifacts should have an explicit name, retention policy, and producer commit. Neither should contain secrets.

## Reusable workflows versus composite actions

| Choose | It packages | It can own |
| --- | --- | --- |
| Reusable workflow | Jobs and orchestration | Runners, permissions, environments, matrices, secrets interface |
| Composite action | A sequence of steps | Inputs and scripts within the caller's job |

Use a reusable workflow for organization-standard CI or deployment. Use a composite action for a repeated setup or tool sequence.

## Environments and approvals

Environments can provide variables, secrets, required reviewers, wait timers, and branch restrictions. Attach the environment to the job that performs the side effect:

```yaml
deploy:
  environment:
    name: production
    url: https://example.com
```

Approval is a repository setting plus a workflow reference; it is not a shell prompt.

## Build once, promote the same artifact

![Build, test, artifact, approval, and deploy pipeline](../02-deployment-patterns/assets/deployment-pipeline.svg)

<sub>Diagram source: [Mermaid](../02-deployment-patterns/assets/deployment-pipeline.mmd).</sub>

Build once, verify the artifact, obtain approval, then deploy that same artifact. Rebuilding during deployment creates a second, potentially different input.

## Runners and services

GitHub-hosted runners are disposable. Self-hosted runners can access private networks and specialized hardware but expand the blast radius of untrusted code. Use isolated ephemeral runners for untrusted workflows, and keep service containers pinned and free of production credentials.

## Sources

- [Events reference](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [Contexts reference](https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs)
- [Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
