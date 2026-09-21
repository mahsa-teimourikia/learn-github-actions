# Reference design

Install both reference workflows because a local reusable workflow must live in
`.github/workflows` before another workflow can call it:

```bash
cp curriculum/intermediate/01-workflow-design/solutions/02-reusable-service-ci.yml \
  .github/workflows/lab-reusable-service-ci.yml
cp curriculum/intermediate/01-workflow-design/solutions/01-selective-monorepo-ci.yml \
  .github/workflows/lab-selective-monorepo-ci.yml
```

The caller owns event selection, change planning, concurrency, fan-out, and the
stable required check. The reusable workflow owns the `v1` service-test
contract, runner, timeout, validation, test command, and report artifact.

The examples use readable major tags for GitHub-authored actions so learners can
see the current action generation. A production repository should follow its
dependency policy and normally pin third-party actions to reviewed full commit
SHAs with an update bot managing changes.
