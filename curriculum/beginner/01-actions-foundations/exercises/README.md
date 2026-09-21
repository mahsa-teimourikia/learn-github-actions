# Workflow lab: trustworthy CI evidence

This lab uses GitHub Actions itself as the learning environment. You will turn a
single-job workflow into a two-job pipeline that preserves failure evidence and
verifies an immutable build artifact on a fresh runner.

## Scenario

Northstar maintains a small subscription-renewal policy package. Pull requests
must test and build the package without write access or secrets. A second job
must prove that the uploaded release candidate is complete and unmodified.

## Before you start

- Read the lesson chapter through **Worked scenario**.
- Run the application locally:

  ```bash
  cd curriculum/beginner/01-actions-foundations/sample-app
  npm ci
  npm run test:ci
  npm run build
  npm run verify:dist
  ```

- Create a practice branch or fork. Workflow runs consume repository resources.
- Never add production credentials to this exercise.

## Install the starter

GitHub only discovers workflow files under `.github/workflows/`. Copy
[`01-foundations-starter.yml`](01-foundations-starter.yml) there on your
practice branch:

```bash
cp curriculum/beginner/01-actions-foundations/exercises/01-foundations-starter.yml \
  .github/workflows/lab-actions-foundations.yml
```

Commit and push the copy, then open a pull request to trigger it. GitHub only
accepts `workflow_dispatch` when the workflow file exists on the repository's
default branch. If you own a disposable practice repository and have first
committed the lab workflow to its default branch, you can also run it from the
Actions tab or with:

```bash
gh workflow run lab-actions-foundations.yml
gh run watch --exit-status
```

## Exercise 1 — establish the execution contract

1. Add a ten-minute timeout to `quality`.
2. Disable persisted checkout credentials.
3. Add workflow concurrency keyed by pull request number or ref.
4. Set `cancel-in-progress: true`.

Observe the event, ref, SHA, runner image, job, and step ordering in the run.
Explain which values GitHub evaluates before a runner starts.

## Exercise 2 — preserve useful evidence

1. Upload `test-results/` even when tests fail, but not after cancellation.
2. Give the artifact a run-attempt-aware name and seven-day retention.
3. Upload `dist/` only after a successful build.
4. Name the release candidate with `github.sha` and retain it for 14 days.
5. Set `if-no-files-found: error` on both uploads.

To inject a failure, temporarily change one expected value in
`sample-app/test/renewal-policy.test.mjs`. Confirm that the run fails while the
diagnostic artifact remains downloadable. Revert the change afterward.

## Exercise 3 — prove job isolation and artifact integrity

1. Add `verify_artifact` with `needs: quality` and a five-minute timeout.
2. Give the verification job `permissions: {}`.
3. Do not check out the repository in this job.
4. Download the exact `northstar-policy-${{ github.sha }}` artifact.
5. Recompute the SHA-256 digest and compare it with `manifest.json`.

The second job must succeed using only the downloaded artifact. This proves
that jobs do not depend on an undocumented shared workspace.

## Exercise 4 — review the trust boundary

For a fork pull request, answer these questions from the run and workflow:

1. Which revision is tested?
2. Which token permissions are available?
3. Can contributor-controlled code write a shared cache?
4. Which steps would become dangerous if secrets were added?
5. Which actions would you pin to full commit SHAs in production?

Compare your result with the [reference solution](../solutions/01-hardened-ci.yml).
Do not copy it until you have inspected at least one successful and one failed
run of your own workflow.

## Completion evidence

Keep links to:

- one successful run;
- one intentionally failed run with retained diagnostics;
- the verified build artifact; and
- a short explanation of the workflow's event, permissions, job dependency,
  state handoff, cancellation behavior, and remaining production risks.
