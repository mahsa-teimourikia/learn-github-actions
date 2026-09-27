# Reference operations workflow

[`01-evidence-led-operations.yml`](01-evidence-led-operations.yml) is the completed
workflow for the lab. It separates operation, analysis, and the stable required
result while keeping the default path read-only and credential-free.

The operation job deliberately captures a failing command with
`continue-on-error`, then reconciles external state, retries only a proven
pre-write failure, writes a structured classification, uploads evidence, and
finally restores the correct failing or successful conclusion. The analyzer runs
even after an operational failure, downloads the evidence, computes historical
SLIs, reconstructs an incident timeline, and retains its report. The final gate
fails if either operation or evidence analysis did not succeed.

Action references are immutable full SHAs with readable release comments. Before
adopting the workflow elsewhere, verify each commit against its official action
repository and choose retention, schedule, runner label, notification routing,
SLIs, and SLOs for the actual service. This lab does not create issues, publish
artifacts externally, access secrets, or mutate a real service.
