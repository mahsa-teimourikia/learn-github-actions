const SEVERITY_WEIGHT = Object.freeze({ low: 1, medium: 3, high: 7, critical: 10 });

const RULES = Object.freeze({
  "checkout-credentials": { severity: "medium", message: "Checkout credentials remain available to later steps." },
  "mutable-action": { severity: "medium", message: "An external action or reusable workflow is not pinned to a full commit SHA." },
  "pwn-request": { severity: "critical", message: "A privileged event checks out and executes untrusted pull-request code." },
  "template-injection": { severity: "high", message: "Untrusted event data is expanded directly into a generated shell script." },
  "privileged-cache-write": { severity: "high", message: "A privileged pull-request event can write to a trusted cache scope." },
  "untrusted-artifact-execution": { severity: "critical", message: "A privileged workflow downloads and executes an untrusted artifact." },
  "write-all": { severity: "high", message: "The workflow grants every supported GITHUB_TOKEN permission write access." },
  "untrusted-self-hosted": { severity: "critical", message: "Untrusted pull-request code can reach a persistent self-hosted runner." },
  "unbounded-retry": { severity: "high", message: "An external side effect is retried without a finite attempt budget." }
});

function runBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
    if (!match) continue;
    const baseIndent = match[1].length;
    const block = [match[2]];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (line.trim() && line.match(/^\s*/)[0].length <= baseIndent) break;
      block.push(line);
    }
    blocks.push(block.join("\n"));
  }
  return blocks;
}

function actionReferences(text) {
  return [...text.matchAll(/\buses:\s*([^\s#]+)/g)].map((match) => match[1]);
}

function isImmutableReference(reference) {
  if (reference.startsWith("./")) return true;
  if (reference.startsWith("docker://")) return /@sha256:[0-9a-f]{64}$/i.test(reference);
  const separator = reference.lastIndexOf("@");
  if (separator < 0) return false;
  return /^[0-9a-f]{40}$/i.test(reference.slice(separator + 1));
}

export function analyzeWorkflow(text, source = "workflow") {
  const findings = [];
  const add = (id, evidence) => {
    if (findings.some((finding) => finding.id === id)) return;
    const rule = RULES[id];
    findings.push({ id, source, evidence, ...rule, weight: SEVERITY_WEIGHT[rule.severity] });
  };

  const references = actionReferences(text);
  if (references.some((reference) => !isImmutableReference(reference))) {
    add("mutable-action", references.filter((reference) => !isImmutableReference(reference)).join(", "));
  }

  if (/uses:\s*actions\/checkout@/i.test(text) && !/persist-credentials:\s*false/i.test(text)) {
    add("checkout-credentials", "actions/checkout without persist-credentials: false");
  }

  const scripts = runBlocks(text);
  const untrustedTemplate = /\$\{\{\s*github\.event\.(?:pull_request\.(?:title|body|head_ref)|issue\.(?:title|body)|comment\.body)/i;
  if (scripts.some((script) => untrustedTemplate.test(script))) {
    add("template-injection", "untrusted github.event field appears inside run");
  }

  const privilegedPullRequest = /\bpull_request_target\s*:/i.test(text);
  const untrustedCheckout = /github\.event\.pull_request\.head\.(?:sha|ref|repo)/i.test(text);
  const executesWorkspace = scripts.some((script) => /\b(?:npm|pnpm|yarn|make|bash|sh|python|node)\b|\.\//i.test(script));
  if (privilegedPullRequest && untrustedCheckout && executesWorkspace) {
    add("pwn-request", "pull_request_target + pull-request head checkout + execution");
  }

  if (privilegedPullRequest && /cache-mode:\s*write/i.test(text)) {
    add("privileged-cache-write", "pull_request_target with cache-mode: write");
  }

  if (/\bworkflow_run\s*:/i.test(text) && /actions\/download-artifact@/i.test(text) && scripts.some((script) => /\b(?:bash|sh|node|python)\s+[^\n]*artifact|\.\/[^\n]*artifact/i.test(script))) {
    add("untrusted-artifact-execution", "workflow_run downloads then executes artifact content");
  }

  if (/permissions:\s*write-all/i.test(text)) add("write-all", "permissions: write-all");
  if (/\bpull_request\s*:/i.test(text) && /runs-on:\s*(?:\[[^\]]*self-hosted|self-hosted)/i.test(text)) {
    add("untrusted-self-hosted", "pull_request scheduled on self-hosted runner");
  }
  if (scripts.some((script) => /\bwhile\s+(?:true|:)|\bfor\s*\(\(\s*;\s*;\s*\)\)/i.test(script))) {
    add("unbounded-retry", "unbounded shell loop");
  }

  return findings.sort((left, right) => right.weight - left.weight || left.id.localeCompare(right.id));
}

export function summarizeFindings(findings) {
  return {
    total: findings.length,
    riskScore: findings.reduce((sum, finding) => sum + finding.weight, 0),
    critical: findings.filter((finding) => finding.severity === "critical").length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length
  };
}

export { RULES };
