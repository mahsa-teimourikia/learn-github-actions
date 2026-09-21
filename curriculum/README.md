# GitHub Actions curriculum

This curriculum is organized by engineering capability rather than by YAML keyword:

```text
BEGINNER                 INTERMEDIATE                ADVANCED
execution model   ->     scalable design      ->     secure operations
workflow syntax          deployment patterns         incident response
```

Every lesson owns its technical chapter and the workflow labs it teaches. Learners work directly with starter workflows, real GitHub runs, realistic fixtures, failure injection, and reference solutions. Supporting scripts may power a fixture, but notebooks and simulated runtimes are not the teaching interface.

## Curriculum map

| Level | Lesson | Main question | Practical artifacts |
| --- | --- | --- | --- |
| Beginner | [01 — Actions foundations](beginner/01-actions-foundations/README.md) | How does an event become trustworthy CI evidence? | [Workflow lab](beginner/01-actions-foundations/exercises/README.md) · [Starter](beginner/01-actions-foundations/exercises/01-foundations-starter.yml) · [Solution](beginner/01-actions-foundations/solutions/01-hardened-ci.yml) · [Sample service](beginner/01-actions-foundations/sample-app/) |
| Beginner | [02 — Workflow syntax](beginner/02-workflow-syntax/README.md) | How do triggers, permissions, jobs, expressions, and concurrency fit together? | [Manual-dispatch workflow](beginner/02-workflow-syntax/manual-dispatch.yml) |
| Intermediate | [01 — Workflow design](intermediate/01-workflow-design/README.md) | How do we reuse, fan out, filter, and transfer data safely? | Four workflow patterns |
| Intermediate | [02 — Deployment patterns](intermediate/02-deployment-patterns/README.md) | How do we build once and promote with bounded side effects? | Five deployment/release workflows |
| Advanced | [01 — Security and reliability](advanced/01-security-and-reliability/README.md) | Where are the trust, credential, dependency, and retry boundaries? | [Security-scan workflow](advanced/01-security-and-reliability/security-scan.yml) |
| Advanced | [02 — Debugging and operations](advanced/02-debugging-and-operations/README.md) | How do we diagnose, observe, recover, and learn from failures? | [Scheduled-maintenance workflow](advanced/02-debugging-and-operations/scheduled-maintenance.yml) |

## How to study a lesson

1. Read its README and identify the event, trust boundary, permissions, state handoff, and side effects.
2. Inspect the owned workflow examples. Replace placeholders before using them elsewhere.
3. Copy the starter into `.github/workflows/` on a practice branch or fork.
4. Run success and failure scenarios, inspect the evidence, and compare with the reference solution.
5. Use the Hub checkpoint, then take the full quiz after each level.

## Progression and exit capabilities

- **Beginner:** author and explain a bounded CI workflow.
- **Intermediate:** choose reusable architecture and design an immutable promotion path.
- **Advanced:** threat-model, troubleshoot, and operate workflows with evidence and recovery controls.

The cross-cutting rule is simple: decide the trust boundary before choosing the trigger, and isolate privileged side effects from untrusted code.
