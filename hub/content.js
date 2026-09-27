const repo = "https://github.com/mahsa-teimourikia/learn-github-actions/blob/main/";

export const lessons = [
  {
    id: "b1-foundations", level: "beginner", step: "01", title: "Actions foundations",
    summary: "Trace a realistic policy-service change from event and revision selection through isolated jobs, artifact verification, failure evidence, and current workflow tooling.",
    outcomes: ["Classify event trust and select the tested revision deliberately", "Derive job execution waves and choose explicit state-transfer channels", "Run, audit, fail, measure, and harden a credential-free Node CI scenario"],
    readme: "curriculum/beginner/01-actions-foundations/README.md", labGuide: "curriculum/beginner/01-actions-foundations/exercises/README.md", starter: "curriculum/beginner/01-actions-foundations/exercises/01-foundations-starter.yml", solution: "curriculum/beginner/01-actions-foundations/solutions/01-hardened-ci.yml",
    checkpoint: { question: "The verification job starts on a fresh runner. Which design proves it verifies the producer's exact release candidate?", options: ["Reuse a dependency cache named build", "Download a commit-bound artifact and verify its manifest digest", "Assume the previous job's workspace is still mounted"], answer: 1, explanation: "Jobs do not share workspaces. An explicitly named artifact plus digest verification makes the cross-job input observable; a cache is not a release handoff." }
  },
  {
    id: "b2-syntax", level: "beginner", step: "02", title: "Workflow syntax",
    summary: "Compile typed release inputs into a bounded job graph, then diagnose schema, expression, graph, matrix, action-interface, and script defects locally with actionlint.",
    outcomes: ["Predict context and expression evaluation at each workflow key", "Transfer validated JSON through step and job outputs into a bounded matrix", "Use pinned static analysis and real GitHub runs as complementary evidence"],
    readme: "curriculum/beginner/02-workflow-syntax/README.md", labGuide: "curriculum/beginner/02-workflow-syntax/exercises/README.md", starter: "curriculum/beginner/02-workflow-syntax/exercises/01-release-orchestration-starter.yml", solution: "curriculum/beginner/02-workflow-syntax/solutions/01-release-orchestration.yml",
    checkpoint: { question: "A workflow has zero actionlint findings. What has that established?", options: ["The workflow is secure and production-ready", "The checked source satisfies the enabled static rules for that tool version", "GitHub will provide every secret, runner, and external service"], answer: 1, explanation: "Static analysis proves only its versioned rule contract. Repository policy, runtime services, authorization, external actions, and side effects still require platform runs and focused review." }
  },
  {
    id: "i1-design", level: "intermediate", step: "01", title: "Workflow design",
    summary: "Compile monorepo change risk into a bounded CI graph with dependency-aware selection, reusable contracts, stable gates, cancellation, and measurable cost.",
    outcomes: ["Calculate critical path separately from runner consumption", "Evaluate an affected-service planner for false negatives", "Version a reusable service-CI contract and preserve one required check"],
    readme: "curriculum/intermediate/01-workflow-design/README.md", labGuide: "curriculum/intermediate/01-workflow-design/exercises/README.md", starter: "curriculum/intermediate/01-workflow-design/exercises/01-baseline-monorepo-ci.yml", solution: "curriculum/intermediate/01-workflow-design/solutions/01-selective-monorepo-ci.yml",
    checkpoint: { question: "A catalog change must also test checkout, which depends on it. What should the planner emit?", options: ["Only the directly changed catalog service", "Catalog and every transitive dependent, with selection reasons", "Every service only when the path glob times out"], answer: 1, explanation: "Path ownership identifies the direct change; dependency propagation preserves validation recall by selecting catalog and checkout." }
  },
  {
    id: "i2-deployment", level: "intermediate", step: "02", title: "Deployment patterns",
    summary: "Promote one verified digest through protected environments, reconcile uncertain writes, evaluate canary evidence, and roll back without hiding failure.",
    outcomes: ["Bind source, release, artifact, and deployment identities", "Constrain environments and OIDC trust before granting authority", "Reconcile timeouts and use compare-and-swap rollback"],
    readme: "curriculum/intermediate/02-deployment-patterns/README.md", labGuide: "curriculum/intermediate/02-deployment-patterns/exercises/README.md", starter: "curriculum/intermediate/02-deployment-patterns/exercises/01-release-pipeline-starter.yml", solution: "curriculum/intermediate/02-deployment-patterns/solutions/01-hardened-release-pipeline.yml",
    checkpoint: { question: "The deploy request times out after the target may have applied the digest. What is the safe next action?", options: ["Rebuild and deploy a new artifact", "Retry immediately with a new key", "Query authoritative target state using the same deployment identity"], answer: 2, explanation: "A timeout is ambiguous. Reconcile the idempotency key and digest first; retry only when the target proves the write did not occur." }
  },
  {
    id: "a1-security", level: "advanced", step: "01", title: "Security and reliability",
    summary: "Close attack paths across events, expressions, actions, caches, artifacts, credentials, runners, and unreliable side effects.",
    outcomes: ["Trace untrusted input to interpreters and authority", "Apply immutable dependencies, negative authorization, and runner isolation", "Enforce scanners and policy through one fail-closed check"],
    readme: "curriculum/advanced/01-security-and-reliability/README.md", labGuide: "curriculum/advanced/01-security-and-reliability/exercises/README.md", starter: "curriculum/advanced/01-security-and-reliability/exercises/01-security-gate-starter.yml", solution: "curriculum/advanced/01-security-and-reliability/solutions/01-hardened-security-gate.yml",
    checkpoint: { question: "A privileged workflow_run job downloads an artifact produced by fork code. What removes the critical path?", options: ["Trust the artifact because its producer check passed", "Execute it after renaming the archive", "Bind producer and source identity, verify digest/provenance, and treat content as data unless explicitly authorized"], answer: 2, explanation: "A green producer does not grant trust. The privileged consumer must validate identity and integrity and must not blindly execute fork-derived content." }
  },
  {
    id: "a2-operations", level: "advanced", step: "02", title: "Debugging and operations",
    summary: "Operate workflows as production systems: trace attempts, preserve structured evidence, reconcile uncertain writes, measure SLOs and cost, and learn from incidents.",
    outcomes: ["Trace run, attempt, job, step, artifact, and external-state identities", "Classify and recover from deterministic, transient, uncertain, and flaky failures", "Measure delivery, success, latency, retries, critical path, cost, and error-budget burn"],
    readme: "curriculum/advanced/02-debugging-and-operations/README.md", labGuide: "curriculum/advanced/02-debugging-and-operations/exercises/README.md", starter: "curriculum/advanced/02-debugging-and-operations/exercises/01-incident-operations-starter.yml", solution: "curriculum/advanced/02-debugging-and-operations/solutions/01-evidence-led-operations.yml",
    checkpoint: { question: "A maintenance request times out after the provider may have applied it. What should the workflow do before any retry?", options: ["Create a new operation key and rerun", "Query authoritative target state with the same idempotency key", "Assume timeout means the write failed"], answer: 1, explanation: "A timeout leaves the write state uncertain. Reconcile the original operation identity against authoritative state and retry only when absence is proven." }
  }
].map((lesson) => ({ ...lesson, links: { readme: repo + lesson.readme, labGuide: repo + lesson.labGuide, starter: repo + lesson.starter, solution: repo + lesson.solution } }));
