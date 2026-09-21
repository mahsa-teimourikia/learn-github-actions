# Debugging and operations

## Lesson outcomes

By the end of this lesson, you can investigate a failed run from evidence, distinguish deterministic, flaky, external, and permission failures, define useful workflow telemetry, and write an incident response sequence.

**Prerequisites:** [Security and reliability](../01-security-and-reliability/README.md).

**Scenario:** a nightly maintenance workflow sometimes fails, occasionally overlaps with a manual rerun, and may have completed an external write before timing out.

**Success criteria:** start from the first failing step, preserve provenance, choose bounded retry only for safe operations, and verify external state before repeating a write. [`scheduled-maintenance.yml`](scheduled-maintenance.yml) is the workflow lab; run it against a safe mock target, inject failures, and reconstruct the incident from GitHub run evidence.

## Read a failed run systematically

1. Confirm the event, branch, commit, actor, and workflow revision.
2. Find the first failed step; later failures may be consequences.
3. Check runner OS, tool versions, working directory, and environment.
4. Inspect expressions and matrix values without exposing secrets.
5. Verify permissions, secrets, variables, environment approvals, and branch rules.
6. Reproduce the command locally with the same runtime and lockfile.
7. Decide whether the failure is deterministic, flaky, quota-related, or external.
8. Fix the smallest responsible layer and add a regression check.

## Common failure classes

| Symptom | Likely cause | First check |
| --- | --- | --- |
| Workflow never appears | Trigger filters or workflow path | Event, branch, path, YAML validity |
| Job is skipped | `needs` failure or `if` condition | Upstream conclusion and condition |
| Command not found | Tool absent on fresh runner | Setup action and runner OS |
| Works locally, fails in CI | Different shell, OS, path, or environment | Runner and working directory |
| Secret is empty | Fork event or wrong scope | Event trust and secret/environment scope |
| Deployment waits forever | Environment reviewer or timer | Environment protection rules |
| Artifact missing | Wrong path, dependency, or name | Upload logs and job relationship |
| Cache misses | Key mismatch or scope | Key, restore keys, lockfile hash |
| Permission denied | Missing job-scoped token permission | `permissions` and action docs |
| Duplicate deploy | Overlap or retry after uncertain write | `concurrency` and external state |

## Targeted debug logging

Enable runner debug logging only as needed. Prefer targeted metadata and never dump complete contexts:

```yaml
- name: Inspect safe metadata
  run: |
    echo "event=${{ github.event_name }}"
    echo "ref=${GITHUB_REF}"
    echo "runner=${RUNNER_OS}"
    pwd
    ls -la
```

## Local validation

Use YAML validation, `bash -n`, ShellCheck, `actionlint`, and a small test repository. A local emulator such as `act` is useful only when you understand its differences from GitHub-hosted runners.

## Re-run policy

Record whether a rerun passed without changes. For flaky tests, fix or quarantine with an owner and expiry date. For rate limits or external services, add bounded retry with backoff and a clear failure message.

## Observability

For important workflows retain workflow/action versions, commit/tag/actor/event/environment, artifact names and checksums, deployment URL and external ID, approval/cancellation records, duration by job and step, and failure category.

## Incident response

If a workflow may have leaked a credential or executed an unexpected action:

1. Disable or cancel it and revoke exposed credentials.
2. Preserve logs, workflow revisions, artifact metadata, and audit events.
3. Identify the earliest suspicious commit or action update.
4. Rotate tokens and review external systems for side effects.
5. Pin or replace the affected action and reduce permissions.
6. Add a regression or policy check before restoring automation.

## Sources

- [Monitoring workflow runs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows)
- [Using workflow run logs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs)
- [Enable debug logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging)
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
