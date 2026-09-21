# Scenario cookbook: guidelines and recipes

## Lesson outcomes

By the end of this lesson, you can separate build from deployment, promote an immutable artifact, protect side effects with environments and concurrency, and replace long-lived cloud keys with a constrained OIDC trust relationship.

**Prerequisite:** [Workflow design](../01-workflow-design/README.md).

**Scenario:** a team is moving from ad-hoc releases to a build-once promotion pipeline with staging, production approval, release provenance, and a rollback-aware operating model.

**Success criteria:** identify which job owns write permissions, show that deployment consumes the tested artifact, and explain retry behavior after an uncertain write. The included workflow files are the labs; install only the safe mock or repository-local paths on a practice branch until environment and cloud prerequisites are deliberately configured.

These recipes are designed to be copied, then adapted. Replace versions, commands, paths, permissions, and deployment targets for your project. Every workflow should be reviewed against the trust model in [Workflow design](../01-workflow-design/README.md).

## Pull request CI

Use `pull_request`, keep permissions read-only, install from a lockfile, upload useful reports, and never expose deployment credentials. See the foundations [reference workflow](../../beginner/01-actions-foundations/solutions/01-hardened-ci.yml).

## Matrix testing

Document supported runtimes and operating systems, use `fail-fast: false` when all failures are useful, use `include` for exceptional combinations, cap `max-parallel`, and avoid dimensions that multiply without improving coverage. See the [baseline monorepo matrix](../01-workflow-design/exercises/01-baseline-monorepo-ci.yml).

## Monorepo path filtering

Include shared configuration in each service's impact model. Document which workflow owns each package, and remember that path filters are not a security boundary. See [the change-detection design](../01-workflow-design/README.md#internal-mechanics-of-change-detection).

## Reusable organization workflow

Define typed inputs and secrets, keep the interface backwards-compatible, document permissions and outputs, pin the called workflow, and make the caller responsible for repository-specific paths. See the [reusable service contract](../01-workflow-design/solutions/02-reusable-service-ci.yml) and [selective caller](../01-workflow-design/solutions/01-selective-monorepo-ci.yml).

## Build once, promote many times

Compile or package only once, name the artifact with the commit or immutable version, download rather than rebuild in deployment jobs, restrict production permissions to the deploy job, and retain provenance. See [`build-and-promote.yml`](build-and-promote.yml).

## Environment-protected deployment

Configure `production` in Settings → Environments, add required reviewers and branch restrictions, attach the environment to the deploy job, serialize deployments with `concurrency`, and document rollback. See [`environment-deployment.yml`](environment-deployment.yml).

## Cloud deployment with OIDC

Grant `id-token: write` only to the deploy job, configure the cloud trust policy to restrict repository/branch/tag/environment claims, use the provider's official login action, and never print tokens. GitHub's [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc) explains the claims. See [`oidc-deployment.yml`](oidc-deployment.yml).

## Release on a tag

Enforce a tag convention such as `v*`, derive the version from the tag or trusted manifest, generate checksums, give release write permission only to publishing, and never publish arbitrary branch pushes. See [`release.yml`](release.yml).

## Scheduled maintenance

Use UTC and document the expected time, make operations idempotent, use a low-privilege token, notify on failure, and expect delayed or duplicated runs. See [`scheduled-maintenance.yml`](../../advanced/02-debugging-and-operations/scheduled-maintenance.yml).

## Manual dispatch

Prefer typed inputs such as `choice`, `boolean`, and `environment`; make dangerous actions opt-in; validate inputs again inside the job; protect production with an environment; and record actor, input, and artifact. See the Workflow Syntax [release-orchestration solution](../../beginner/02-workflow-syntax/solutions/01-release-orchestration.yml).

## GitHub Pages deployment

Enable Pages with GitHub Actions as the source, upload the site as a Pages artifact, use the Pages actions together, keep deployment permissions scoped, and verify the Pages environment exists before debugging YAML. See [`pages-deployment.yml`](pages-deployment.yml).

## Security scanning

Use CodeQL and dependency review with the smallest permissions, upload SARIF only from trusted contexts, review third-party actions, and treat findings as policy decisions. See [`security-scan.yml`](../../advanced/01-security-and-reliability/security-scan.yml).

## Container build and provenance

Use a minimal context and pinned base image, authenticate with OIDC or a short-lived token, tag with an immutable commit identifier, generate attestations for sensitive artifacts, and keep registry write access out of test jobs. See GitHub's [artifact attestation guide](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).

## Retry, timeout, and cancellation

Retry network reads and idempotent builds, not payments, releases, migrations, or permission changes. Set `timeout-minutes`, use `concurrency`, and verify external state after an uncertain write.

## Recipe checklist

- [ ] Trigger and path filters match intended scope.
- [ ] Trust boundary is documented.
- [ ] Permissions are explicit and minimal.
- [ ] Actions are pinned or reviewed.
- [ ] Jobs have timeouts and clear dependencies.
- [ ] Build outputs use artifacts, not hidden workspace assumptions.
- [ ] Deployments use environments and concurrency.
- [ ] Secrets are not exposed to untrusted code.
- [ ] Retry and cancellation behavior is safe.
- [ ] Logs and artifacts make failures diagnosable.
