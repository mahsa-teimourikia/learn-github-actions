# Contributing

Thanks for improving Learn GitHub Actions.

Good contributions are self-contained explanations, complete runnable workflows, scenario recipes with a goal and trust model, official documentation links, or corrections to syntax and security guidance.

Keep lesson content together under `curriculum/<level>/<number-topic>/`. A lesson owns its `README.md`, guided workflow exercises, starter/reference workflow YAML, realistic fixtures, and topic-specific assets. Do not recreate parallel `docs/` or `examples/` trees. GitHub Actions lessons use workflow-native labs rather than notebooks or simulated runtimes.

Every new example should include a descriptive name, appropriate trigger, explicit permissions, safe placeholders, no real secrets, a timeout for expensive jobs, and an explanation of whether the event can run untrusted code.

Quiz questions must test concepts explained here, have at least two correct answers, include an explanation and source link, and avoid ephemeral product limits.

Run the complete validation suite before opening a pull request:

```bash
make test
```

The suite checks curriculum shape, local links, workflow-lab structure, fixture behavior, Hub packaging, and quiz grading. Labs must not require production credentials or irreversible external side effects.

Pull requests should explain: context, what changed, validation performed, deployment impact, and review focus.

By contributing, you agree that your contribution will be licensed under this repository's MIT License.
