import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { authorize } from "../src/authorization-policy.mjs";
import { analyzeWorkflow, summarizeFindings } from "../src/workflow-policy.mjs";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonRoot = path.resolve(fixtureRoot, "..");

async function analyze(relativePath) {
  return analyzeWorkflow(await readFile(path.join(lessonRoot, relativePath), "utf8"), relativePath);
}

test("pwn request fixture exposes the complete privileged execution path", async () => {
  const ids = (await analyze("fixtures/vulnerable/pwn-request.yml.txt")).map(({ id }) => id);
  assert.deepEqual(ids, ["pwn-request", "checkout-credentials", "mutable-action"]);
});

test("hardened pull-request validation has no modeled finding", async () => {
  assert.deepEqual(await analyze("fixtures/hardened/pwn-request.yml.txt"), []);
});

test("direct event interpolation is distinguished from environment transfer", async () => {
  assert.ok((await analyze("fixtures/vulnerable/script-injection.yml.txt")).some(({ id }) => id === "template-injection"));
  assert.ok(!(await analyze("fixtures/hardened/script-injection.yml.txt")).some(({ id }) => id === "template-injection"));
});

test("privileged cache writes are rejected while read-only pull-request caches pass", async () => {
  assert.ok((await analyze("fixtures/vulnerable/privileged-cache.yml.txt")).some(({ id }) => id === "privileged-cache-write"));
  assert.deepEqual(await analyze("fixtures/hardened/privileged-cache.yml.txt"), []);
});

test("download-and-execute is distinguished from digest validation", async () => {
  assert.ok((await analyze("fixtures/vulnerable/artifact-confusion.yml.txt")).some(({ id }) => id === "untrusted-artifact-execution"));
  assert.deepEqual(await analyze("fixtures/hardened/artifact-confusion.yml.txt"), []);
});

test("summary weights critical paths above hygiene findings", () => {
  const findings = analyzeWorkflow("on: { workflow_dispatch: {} }\npermissions: write-all\njobs:\n  retry:\n    runs-on: ubuntu-latest\n    steps:\n      - run: |\n          while true; do deploy; done\n");
  assert.deepEqual(summarizeFindings(findings), { total: 2, riskScore: 14, critical: 0, high: 2, medium: 0, low: 0 });
});

test("fork pull requests cannot acquire write authority", () => {
  assert.deepEqual(authorize({ event: "pull_request", fork: true, write: true }), { allow: false, reason: "untrusted-write" });
});

test("fork pull requests cannot use persistent self-hosted runners", () => {
  assert.deepEqual(authorize({ event: "pull_request", fork: true, write: false, secrets: false, runner: "self-hosted" }), { allow: false, reason: "untrusted-self-hosted" });
});

test("production requires protection, a trusted tag, and a verified artifact", () => {
  const base = { event: "push", fork: false, write: true, environment: "production", protectedEnvironment: true, refType: "tag", artifactVerified: true };
  assert.deepEqual(authorize(base), { allow: true, reason: "protected-release" });
  assert.equal(authorize({ ...base, protectedEnvironment: false }).allow, false);
  assert.equal(authorize({ ...base, refType: "branch" }).allow, false);
  assert.equal(authorize({ ...base, artifactVerified: false }).allow, false);
});

test("OIDC audience mismatch fails closed", () => {
  const decision = authorize({ event: "push", environment: "production", protectedEnvironment: true, refType: "tag", artifactVerified: true, oidc: true, audience: "wrong", expectedAudience: "cloud" });
  assert.deepEqual(decision, { allow: false, reason: "oidc-audience-mismatch" });
});
