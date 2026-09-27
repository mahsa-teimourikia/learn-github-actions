# Reference release pipeline

Copy the reference workflow into GitHub's discovery directory on a practice
branch:

```bash
cp curriculum/intermediate/02-deployment-patterns/solutions/01-hardened-release-pipeline.yml \
  .github/workflows/lab-hardened-release-pipeline.yml
```

The default path is credential-free and deploys only to lesson-owned state files
on the runner. Create `lab-staging` and `lab-production` environments to observe
deployment history. Add a required reviewer to `lab-production` when your plan
and repository visibility support it.

Do not replace the mock with a real target until you have independently reviewed
the provider's official authentication action, configured OIDC claim conditions,
defined rollback and reconciliation, and restricted the production environment.
