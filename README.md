# ✨ Learn GitHub Actions ✨

> A structured, hands-on course for designing, writing, debugging, securing, and operating GitHub Actions workflows.

[![Validate learning materials](https://github.com/mahsa-teimourikia/learn-github-actions/actions/workflows/validate-learning.yml/badge.svg)](https://github.com/mahsa-teimourikia/learn-github-actions/actions/workflows/validate-learning.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![One+i](https://img.shields.io/badge/learning-One%2Bi-0969da)](https://oneplusi.io)

GitHub Actions is GitHub's workflow automation platform for CI/CD and repository operations. Events trigger workflows, jobs run on isolated runners, and steps execute commands or reusable actions. The engineering challenge is not merely writing YAML—it is choosing safe trust boundaries, explicit state handoffs, reliable delivery controls, and observable recovery paths.

## Start in the Learning Hub

**[Open the GitHub Actions Learning Hub →](https://mahsa-teimourikia.github.io/learn-github-actions/)**

The Hub is the main entry point. Filter by level, select a lesson, and work through **Learn → Lab → Checkpoint**. It tracks progress locally in your browser and links every lesson to its technical chapter, workflow lab, starter, and reference implementation.

Prefer repository navigation? Open the [curriculum index](curriculum/README.md) or take the [full knowledge check](https://mahsa-teimourikia.github.io/learn-github-actions/quiz/).

## Curriculum roadmap

| Level | Lesson | Capability |
| --- | --- | --- |
| Beginner | [Actions foundations](curriculum/beginner/01-actions-foundations/README.md) | Trace event → workflow → job → runner → step → result |
| Beginner | [Workflow syntax](curriculum/beginner/02-workflow-syntax/README.md) | Compile typed inputs, safe expressions, outputs, dynamic matrices, containers, and concurrency into a predictable run graph |
| Intermediate | [Workflow design](curriculum/intermediate/01-workflow-design/README.md) | Choose reuse boundaries, control fan-out, and make data movement explicit |
| Intermediate | [Deployment patterns](curriculum/intermediate/02-deployment-patterns/README.md) | Build once, promote immutably, protect environments, and use OIDC |
| Advanced | [Security and reliability](curriculum/advanced/01-security-and-reliability/README.md) | Threat-model events, dependencies, credentials, runners, and retries |
| Advanced | [Debugging and operations](curriculum/advanced/02-debugging-and-operations/README.md) | Investigate failures, preserve evidence, observe runs, and recover safely |

See the [course improvement plan](COURSE_PLAN.md) for the evidence-based lesson review sequence and [ROADMAP.md](ROADMAP.md) for longer-term additions.

## Repository structure

```text
curriculum/
├── beginner/
├── intermediate/
└── advanced/       # each lesson owns its chapter and workflow-native labs
hub/                # static GitHub Pages Learning Hub
quiz/               # full interactive knowledge check
assets/             # shared brand assets only
scripts/            # link, workflow-lab, and Pages validation
tests/              # built-site smoke tests
.github/             # validation, Pages deployment, and contribution templates
```

The previous parallel `docs/` and `examples/` trees have been consolidated. Lesson-specific explanations and workflows now live together, so moving or extending a lesson does not leave its practical material disconnected.

## Run locally

Requirements: Python 3.11 or newer, Node.js 24 or newer, and GNU Make.

```bash
make test
```

This validates all local Markdown links and workflow-lab structure, executes the sample application and focused tests, tests quiz grading, builds the static Hub plus quiz, and smoke-tests the output. No API keys or GitHub tokens are required for repository validation; learner workflow experiments run on a practice branch or fork.

To preview the generated site:

```bash
make pages
python3 -m http.server 8000 --directory site
```

Then open `http://localhost:8000`.

## How the examples are designed

- Pull-request validation starts read-only and receives no deployment credentials.
- Build output crosses jobs as an artifact; dependency caches are never treated as release artifacts.
- Privileged deployment permissions belong only to deployment jobs.
- Production side effects use environments, concurrency, and explicit retry/reconciliation policy.
- OIDC examples avoid long-lived cloud keys and require constrained cloud-side trust.
- Workflow inputs and event fields are treated as untrusted data at shell boundaries.
- Major action tags are readable for learning; production use should pin reviewed full commit SHAs.

## Practical guides

- [Event and execution model](curriculum/beginner/01-actions-foundations/README.md)
- [Workflow syntax reference](curriculum/beginner/02-workflow-syntax/README.md)
- [Cache, artifact, matrix, and reuse decisions](curriculum/intermediate/01-workflow-design/README.md)
- [Scenario and deployment cookbook](curriculum/intermediate/02-deployment-patterns/README.md)
- [Security review checklist](curriculum/advanced/01-security-and-reliability/README.md)
- [Failure triage and incident response](curriculum/advanced/02-debugging-and-operations/README.md)

## Official references

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [Contexts](https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs)
- [Reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)

## Contributing and support

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a lesson or workflow. Community and reporting guidance is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SUPPORT.md](SUPPORT.md), and [SECURITY.md](SECURITY.md).

## License

This repository is licensed under the [MIT License](LICENSE).
