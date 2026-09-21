# Workflow lab: harden a release from build to rollback

You will evolve a safe staging pipeline into an evidence-backed release state
machine. The target is intentionally local to the runner. The GitHub workflow,
artifact service, environment history, approval state, concurrency behavior,
logs, and conclusions are real; the external deployment side effect is mocked.

## Safety boundary

- Work in a fork or disposable practice repository.
- Use only `lab-staging` and `lab-production` environments.
- Do not add cloud credentials, registry tokens, repository write permissions,
  real package publication, or a production endpoint.
- Never print an OIDC token or full environment/context dump.
- The diagnostic fixtures are for review; do not install their anti-patterns.
- Workflow runs and stored artifacts may consume quota.

## 1. Validate the lifecycle locally

```bash
cd curriculum/intermediate/02-deployment-patterns/release-fixture
npm ci --ignore-scripts --no-audit --no-fund
npm test
RELEASE_VERSION=v1.2.3 \
RELEASE_COMMIT=abcdef0123456789abcdef0123456789abcdef01 \
npm run build
EXPECTED_VERSION=v1.2.3 \
EXPECTED_COMMIT=abcdef0123456789abcdef0123456789abcdef01 \
npm run verify
npm run evaluate
```

Record the manifest digest. Change one byte in
`dist/northstar-release.json`, rerun verification, and confirm the mismatch is
detected. Rebuild to restore the artifact.

## 2. Install and observe the starter

```bash
cp curriculum/intermediate/02-deployment-patterns/exercises/01-release-pipeline-starter.yml \
  .github/workflows/lab-release-pipeline-starter.yml
```

Commit and push the workflow. Dispatch version `v1.0.0`. GitHub creates the
referenced environments automatically if they do not exist, but that does not
create protection rules.

Capture:

- source SHA and requested version;
- artifact name, service-generated artifact digest, and manifest SHA-256;
- build and staging runner identities;
- downloaded manifest identity;
- staging deployment record and conclusion; and
- the idempotency key used by the mock target.

Explain why the fresh staging runner cannot rely on the build workspace.

## 3. Prove build-once promotion

Inspect [`rebuild-during-deploy.yml.txt`](../fixtures/rebuild-during-deploy.yml.txt).
Do not add it to the workflow. Instead:

1. verify the digest immediately after build;
2. export digest, version, and commit as job outputs;
3. download the artifact on each new runner;
4. verify all identity fields before mutation; and
5. deploy using the verified manifest digest.

Temporarily change the expected digest passed to staging. The deployment step
must never run. Restore the value and retain the failed run as evidence.

## 4. Install the hardened reference

```bash
cp curriculum/intermediate/02-deployment-patterns/solutions/01-hardened-release-pipeline.yml \
  .github/workflows/lab-hardened-release-pipeline.yml
```

Dispatch with production disabled. Verify the graph is:

```text
build → fresh-runner verification → staging deploy + health
```

Production is intentionally skipped. Compare elapsed time with total job time;
the separate verifier costs capacity but proves the artifact contract outside
the producer workspace.

## 5. Configure environment protection

In repository settings, open Environments:

1. create or select `lab-staging`;
2. create or select `lab-production`;
3. restrict `lab-production` to the branch/tag policy appropriate for the
   practice repository;
4. add a required reviewer and prevent self-review when the repository plan and
   visibility support those controls; and
5. decide explicitly whether administrators may bypass the rule.

Dispatch a production run. Before approval, confirm the production job has not
started and cannot access environment-scoped configuration. Review the artifact
digest, source SHA, verification, staging result, failure injection, and rollback
plan before approving.

If required reviewers are unavailable on the repository's plan, document that
gap rather than claiming YAML provided approval.

## 6. Inspect the identity contract before adding OIDC

The production job creates `oidc-trust-contract-<sha>`. Download it and review
the required issuer, audience, repository ID, owner ID, environment, and workflow
reference.

Answer:

1. Why are numeric repository and owner IDs stronger against rename/reuse than
   names alone?
2. Why should staging claims fail the production role condition?
3. What changes if deployment moves into a central reusable workflow?
4. Which events and refs should the cloud allow?
5. How short should the provider credential live, and who can revoke it?

Review [`oidc-cloud-template.yml.txt`](../fixtures/oidc-cloud-template.yml.txt).
Do not activate it in this lab. In a real integration, inspect actual claims,
configure the provider first, use its official action, pin reviewed code, scope
the role to the target, and grant `id-token: write` only to the deploy job.

## 7. Resolve uncertain writes

Run the production workflow three times:

| `failure_mode` | Expected target behavior | Expected workflow behavior |
| --- | --- | --- |
| `none` | Write confirmed | Continue without reconciliation |
| `before-write` | Target remains at baseline | Reconcile as not applied; retry once with same key |
| `after-write` | New digest is active; response appears failed | Reconcile as applied; do not retry |

For each run, record the first attempt outcome, reconciliation resolution,
whether retry ran, final active digest, and production job conclusion.

Compare with [`blind-retry.yml.txt`](../fixtures/blind-retry.yml.txt). Explain how
blind retry could duplicate a release, migration, payment, or notification.

## 8. Fail the canary and verify rollback

Dispatch with `deploy_production=true`, `failure_mode=none`, and
`canary_mode=unhealthy`.

The expected sequence is:

1. the new digest is applied;
2. deterministic error-rate and latency signals violate policy;
3. rollback verifies the current digest before restoring the previous digest;
4. rollback succeeds; and
5. the production job still fails.

Now imagine another deployment changed the target between health failure and
rollback. The compare-and-swap guard must refuse to overwrite it. Explain the
operator decision required next.

## 9. Compare rollout architectures

For each situation, choose rolling, blue/green, canary, feature flag, GitOps, or
a combination and justify rollback semantics:

1. stateless API with high traffic and backward-compatible schema;
2. low-traffic internal service where a 5% canary cannot reach a useful sample;
3. Kubernetes fleet with strict drift reconciliation;
4. mobile behavior that must be disabled without a new app-store release;
5. package publication where the version cannot be overwritten; and
6. multi-region service with data residency and ordered promotion.

Name the controller, source of truth, health signal, minimum observation window,
authority boundary, and terminal states for each design.

## 10. Evaluate provenance and release immutability

Review [`attested-release.yml.txt`](../fixtures/attested-release.yml.txt).
In a supported public practice repository, you may add an optional attestation
experiment after independently confirming current permissions and action version.

Compare evidence:

| Evidence | Tampered bytes | Wrong workflow | Known vulnerable dependency | Unhealthy rollout |
| --- | --- | --- | --- | --- |
| SHA-256 manifest | detects | no | no | no |
| Verified build attestation | detects subject mismatch | detects policy mismatch | no | no |
| SBOM + vulnerability policy | indirect | no | can detect known issue | no |
| Canary health gate | maybe behaviorally | no | maybe behaviorally | detects defined signals |

Explain why all four may be useful and none alone proves “safe.” If immutable
releases are enabled, practice the draft → attach assets → publish sequence on a
throwaway version rather than a real release line.

## 11. Complete the evaluation record

| Case | Expected digest | Final digest | Reconciliation | Retry | Rollback | Final conclusion | Correct? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Healthy |  |  | none | no | no | success |  |
| Tampered |  | baseline | none | no | no | failure |  |
| Before write |  |  | not-applied | once | no | success |  |
| After write |  |  | applied | no | no | success |  |
| Unhealthy |  | baseline | none | no | yes | failure |  |
| Key collision |  | unchanged | conflict | no | no | failure |  |

Report:

- exact final-state rate for the six labeled cases;
- any unresolved uncertain outcome;
- build, verification, approval wait, deploy, observation, and recovery time;
- whether one digest remained continuous through all stages;
- the permission delta between build and a real OIDC deployment;
- every configured bypass path; and
- the evidence needed to reconstruct actor, source, artifact, target, decision,
  and final state.

## 12. Production design review

Write a short decision record covering:

- artifact storage, retention, digest, attestation, and verifier;
- target environments, owners, branch/tag rules, reviewers, and bypass;
- OIDC issuer/audience/claim conditions and cloud role permissions;
- rollout controller, exposure steps, signals, samples, and abort thresholds;
- idempotency key ownership and authoritative reconciliation API;
- database/schema compatibility and forward-fix versus rollback policy;
- concurrency across every workflow that can mutate the target;
- telemetry, deployment markers, audit retention, and incident routing; and
- emergency access, provider outage, and control-plane rollback.

## Completion evidence

Keep links or artifacts for:

- one starter staging run;
- one failed identity-verification run;
- one production run paused for environment approval, when supported;
- healthy, before-write, after-write, and unhealthy-canary production runs;
- the OIDC trust contract artifact;
- a successful rollback with a failed workflow conclusion;
- the completed evaluation table; and
- the production decision record.

Finish the Hub checkpoint and the Deployment category of the full quiz.
