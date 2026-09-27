# Reference solution

[`01-release-orchestration.yml`](01-release-orchestration.yml) is the completed
workflow for the syntax lab. Review it only after you have run the starter and
recorded your own expected-versus-observed results.

The solution is intentionally safe by default: pull requests generate plans and
validate components, while the release job only prints a bounded simulation.
No secrets or external deployment credentials are required.

Readable major action tags support the progressive teaching workflow. Production
workflows should pin reviewed full commit SHAs and automate reviewed update
proposals.

[`02-actionlint-clean.yml`](02-actionlint-clean.yml) is the clean comparison for
the [local actionlint workshop](../actionlint-workshop/README.md). It repairs the
six isolated diagnostic categories with a valid trigger, inferred matrix
properties, an explicit dependency, valid action inputs, and an environment
boundary for untrusted event data. It remains read-only, credential-free, and
pins external actions to reviewed full SHAs.
