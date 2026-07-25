# Scenario cookbook: guidelines and recipes

These recipes are designed to be copied, then adapted. Replace versions, commands, paths, permissions, and deployment targets for your project. Every workflow should be reviewed against the trust model in [Core concepts](core-concepts.md).

## Pull request CI

Use `pull_request`, keep permissions read-only, install from a lockfile, upload useful reports, and never expose deployment credentials. See [`examples/ci-node.yml`](../examples/ci-node.yml).

## Matrix testing

Document supported runtimes and operating systems, use `fail-fast: false` when all failures are useful, use `include` for exceptional combinations, cap `max-parallel`, and avoid dimensions that multiply without improving coverage. See [`examples/matrix-ci.yml`](../examples/matrix-ci.yml).

## Monorepo path filtering

Include shared configuration in each service's path list. Document which workflow owns each package, and remember that path filters are not a security boundary. See [`examples/path-filtered-ci.yml`](../examples/path-filtered-ci.yml).

## Reusable organization workflow

Define typed inputs and secrets, keep the interface backwards-compatible, document permissions and outputs, pin the called workflow, and make the caller responsible for repository-specific paths. See [`examples/reusable-ci.yml`](../examples/reusable-ci.yml) and [`examples/call-reusable-ci.yml`](../examples/call-reusable-ci.yml).

## Build once, promote many times

Compile or package only once, name the artifact with the commit or immutable version, download rather than rebuild in deployment jobs, restrict production permissions to the deploy job, and retain provenance. See [`examples/build-and-promote.yml`](../examples/build-and-promote.yml).

## Environment-protected deployment

Configure `production` in Settings → Environments, add required reviewers and branch restrictions, attach the environment to the deploy job, serialize deployments with `concurrency`, and document rollback. See [`examples/environment-deployment.yml`](../examples/environment-deployment.yml).

## Cloud deployment with OIDC

Grant `id-token: write` only to the deploy job, configure the cloud trust policy to restrict repository/branch/tag/environment claims, use the provider's official login action, and never print tokens. GitHub's [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc) explains the claims. See [`examples/oidc-deployment.yml`](../examples/oidc-deployment.yml).

## Release on a tag

Enforce a tag convention such as `v*`, derive the version from the tag or trusted manifest, generate checksums, give release write permission only to publishing, and never publish arbitrary branch pushes. See [`examples/release.yml`](../examples/release.yml).

## Scheduled maintenance

Use UTC and document the expected time, make operations idempotent, use a low-privilege token, notify on failure, and expect delayed or duplicated runs. See [`examples/scheduled-maintenance.yml`](../examples/scheduled-maintenance.yml).

## Manual dispatch

Prefer typed inputs such as `choice`, `boolean`, and `environment`; make dangerous actions opt-in; validate inputs again inside the job; protect production with an environment; and record actor, input, and artifact. See [`examples/manual-dispatch.yml`](../examples/manual-dispatch.yml).

## GitHub Pages deployment

Enable Pages with GitHub Actions as the source, upload the site as a Pages artifact, use the Pages actions together, keep deployment permissions scoped, and verify the Pages environment exists before debugging YAML. See [`examples/pages-deployment.yml`](../examples/pages-deployment.yml).

## Security scanning

Use CodeQL and dependency review with the smallest permissions, upload SARIF only from trusted contexts, review third-party actions, and treat findings as policy decisions. See [`examples/security-scan.yml`](../examples/security-scan.yml).

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
