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
    summary: "Author triggers, permissions, jobs, expressions, outputs, matrices, and concurrency with safe shell boundaries.",
    outcomes: ["Set restrictive default permissions", "Connect dependent jobs explicitly", "Keep untrusted event data out of shell syntax"],
    readme: "curriculum/beginner/02-workflow-syntax/README.md", labGuide: "curriculum/beginner/02-workflow-syntax/README.md", starter: "curriculum/beginner/02-workflow-syntax/manual-dispatch.yml", solution: "curriculum/beginner/02-workflow-syntax/manual-dispatch.yml",
    checkpoint: { question: "Where should an untrusted issue title be placed before a shell step reads it?", options: ["Directly inside run", "An environment variable read with quoting", "The workflow name"], answer: 1, explanation: "Pass the expression as environment data and quote the shell expansion so content is not parsed as shell syntax." }
  },
  {
    id: "i1-design", level: "intermediate", step: "01", title: "Workflow design",
    summary: "Choose trust-aware events, control matrix fan-out, distinguish caches from artifacts, and design versioned reusable workflow interfaces.",
    outcomes: ["Quantify matrix cost", "Choose reusable workflow versus composite action", "Make cross-job state explicit"],
    readme: "curriculum/intermediate/01-workflow-design/README.md", labGuide: "curriculum/intermediate/01-workflow-design/README.md", starter: "curriculum/intermediate/01-workflow-design/matrix-ci.yml", solution: "curriculum/intermediate/01-workflow-design/reusable-ci.yml",
    checkpoint: { question: "Which abstraction can own jobs, runners, permissions, and environments?", options: ["Composite action", "Reusable workflow", "Shell function"], answer: 1, explanation: "Reusable workflows package jobs and orchestration. Composite actions package steps inside the caller's job." }
  },
  {
    id: "i2-deployment", level: "intermediate", step: "02", title: "Deployment patterns",
    summary: "Build once, promote an immutable artifact, protect production with environments, and use constrained OIDC trust.",
    outcomes: ["Separate build and deploy permissions", "Promote the tested artifact", "Reconcile uncertain writes before retry"],
    readme: "curriculum/intermediate/02-deployment-patterns/README.md", labGuide: "curriculum/intermediate/02-deployment-patterns/README.md", starter: "curriculum/intermediate/02-deployment-patterns/build-and-promote.yml", solution: "curriculum/intermediate/02-deployment-patterns/environment-deployment.yml",
    checkpoint: { question: "A release call times out and external state is unknown. What happens next?", options: ["Retry immediately", "Rebuild and deploy", "Reconcile external state before retry"], answer: 2, explanation: "A timeout does not prove the write failed. Verify target state before attempting a potentially duplicate side effect." }
  },
  {
    id: "a1-security", level: "advanced", step: "01", title: "Security and reliability",
    summary: "Threat-model workflow events, minimize permissions, pin dependencies, isolate untrusted code, and make writes retry-safe.",
    outcomes: ["Classify event trust boundaries", "Recognize shell injection and mutable dependency risk", "Bound credentials, runners, and retries"],
    readme: "curriculum/advanced/01-security-and-reliability/README.md", labGuide: "curriculum/advanced/01-security-and-reliability/README.md", starter: "curriculum/advanced/01-security-and-reliability/security-scan.yml", solution: "curriculum/advanced/01-security-and-reliability/security-scan.yml",
    checkpoint: { question: "Which combination creates the clearest critical risk?", options: ["Read-only pull_request validation", "Privileged pull_request_target that executes fork code", "A scheduled read-only lint"], answer: 1, explanation: "The base-repository privilege of pull_request_target must never be combined with blindly executing untrusted fork code." }
  },
  {
    id: "a2-operations", level: "advanced", step: "02", title: "Debugging and operations",
    summary: "Investigate failures from evidence, capture useful telemetry, define rerun policy, and respond to workflow security incidents.",
    outcomes: ["Start from run identity and the first failed step", "Classify deterministic, flaky, permission, and external failures", "Preserve evidence and recover safely"],
    readme: "curriculum/advanced/02-debugging-and-operations/README.md", labGuide: "curriculum/advanced/02-debugging-and-operations/README.md", starter: "curriculum/advanced/02-debugging-and-operations/scheduled-maintenance.yml", solution: "curriculum/advanced/02-debugging-and-operations/scheduled-maintenance.yml",
    checkpoint: { question: "What should an investigation inspect before the final cascade of errors?", options: ["The first failed step", "Only the summary", "Every secret value"], answer: 0, explanation: "Later failures are often consequences. Start with run identity and the earliest failing step without exposing secrets." }
  }
].map((lesson) => ({ ...lesson, links: { readme: repo + lesson.readme, labGuide: repo + lesson.labGuide, starter: repo + lesson.starter, solution: repo + lesson.solution } }));
