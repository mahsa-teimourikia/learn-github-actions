# Reference solution

[`01-release-orchestration.yml`](01-release-orchestration.yml) is the completed
workflow for the syntax lab. Review it only after you have run the starter and
recorded your own expected-versus-observed results.

The solution is intentionally safe by default: pull requests generate plans and
validate components, while the release job only prints a bounded simulation.
No secrets or external deployment credentials are required.

Readable major action tags support teaching. Production workflows should pin
reviewed full commit SHAs and automate reviewed update proposals.
