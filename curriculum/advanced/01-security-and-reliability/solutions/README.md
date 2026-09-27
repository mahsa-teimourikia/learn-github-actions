# Reference security gate

[`01-hardened-security-gate.yml`](01-hardened-security-gate.yml) is the completed
workflow for the lab. It is safe by default: read-only permissions, immutable
action pins, disabled checkout credential persistence, no secrets, no external
writes, no untrusted self-hosted runner, and bounded execution.

The jobs separate four different assurance layers:

1. deterministic threat-model and negative-authorization regression tests;
2. `zizmor` analysis of the installed workflow;
3. GitHub dependency review on pull requests; and
4. one stable required check that fails if any applicable layer fails.

`step-security/harden-runner` is intentionally in audit mode so the learner can
observe network destinations before considering an allowlist. Audit mode is
evidence, not containment. In a production repository, review the observed
destinations and decide whether block mode fits the runner, package mirrors,
and incident-response model.

Copy the file into `.github/workflows/lab-hardened-security-gate.yml` only in a
fork or disposable practice repository. The dependency-review job requires a
pull request and GitHub's dependency graph. The public-repository path works
without paid GitHub Advanced Security; the `zizmor` job therefore emits console
findings and annotations rather than uploading SARIF.
