# Security and reliability

GitHub Actions workflows are executable supply-chain configuration. They can read repository contents, run arbitrary commands, access tokens, publish artifacts, and change external systems. Treat workflow changes like application code.

## Least privilege

Start with read-only permissions and elevate only the job that needs it:

```yaml
permissions:
  contents: read

jobs:
  release:
    permissions:
      contents: write
      id-token: write
```

The [secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use) recommends least privilege. `id-token: write` enables OIDC token requests; it is not general repository write access.

## Pin actions

A mutable tag can move after review. GitHub recommends pinning actions to a full-length commit SHA:

```yaml
- uses: actions/checkout@<reviewed-sha> # v4
```

Record the human version in a comment, review updates deliberately, and use Dependabot or an equivalent process to propose upgrades.

## Untrusted pull requests

Fork pull requests can change scripts, tests, manifests, and Dockerfiles. Those commands run on the runner. Keep `pull_request` jobs secret-free and read-only.

Avoid checking out and executing fork code in a privileged `pull_request_target` job. That event runs in the base repository's context and may access secrets. Use it only for narrowly reviewed metadata operations.

## Shell injection

Event fields can contain shell syntax. Do not interpolate them into `run` scripts:

```yaml
# Risky.
- run: echo "${{ github.event.pull_request.title }}"

# Safer.
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: printf '%s\n' "$PR_TITLE"
```

Use `printf`, quote variables, prefer structured action inputs, and validate allowlisted values.

## Secrets

Store credentials in repository, organization, or environment secrets; scope production secrets to a protected environment; do not pass secrets to reusable workflows unless required; never print contexts or secret-bearing command lines; and rotate credentials after suspicious workflow changes or runner exposure.

## OIDC and cloud trust

OIDC lets a workflow exchange a short-lived GitHub identity token for cloud credentials:

```yaml
permissions:
  contents: read
  id-token: write
```

The cloud trust policy should restrict repository, branch, tag, and environment claims. See the [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc).

## Environments

Put material side effects behind an environment with required reviewers, branch restrictions, and environment-scoped secrets:

```yaml
deploy:
  environment:
    name: production
    url: https://example.com
```

## Runners

GitHub-hosted runners are ephemeral and suitable for most untrusted CI. Self-hosted runners can reach private networks and contain persistent state; for untrusted workflows use isolated ephemeral runners, restricted network access, cleanup hooks, and monitoring.

## Reliability controls

### Timeouts and concurrency

Set `timeout-minutes` and use a group matching the resource being changed:

```yaml
concurrency:
  group: production
  cancel-in-progress: false
```

Cancel stale previews, but serialize production releases.

### Idempotency

Retries, duplicate deliveries, and operator reruns happen. Use immutable artifact names, idempotency keys, state checks, and reconciliation. A timeout after a publish call is not evidence that the publish failed.

### Artifacts and attestations

Name artifacts with commit identity and retain them long enough to debug. For binaries and containers, consider [artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) to establish build provenance.

## Review checklist

- [ ] Every workflow sets explicit permissions.
- [ ] Third-party actions are pinned to reviewed SHAs.
- [ ] Fork code cannot access secrets or write tokens.
- [ ] Event fields are safely passed to shell commands.
- [ ] Deployment credentials are environment-scoped.
- [ ] Cloud access uses OIDC where supported.
- [ ] Self-hosted runners are isolated and ephemeral for untrusted jobs.
- [ ] Jobs have timeouts and concurrency.
- [ ] Writes are idempotent and externally verified.
- [ ] Artifacts and logs are free of sensitive data.
