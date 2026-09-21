import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import test from "node:test";
import { buildMatrix, createPlan, matrixSize, parseBoolean, parseComponents } from "../src/release-plan.mjs";

const fixtureDirectory = fileURLToPath(new URL("../", import.meta.url));

test("parses typed booleans deliberately", () => {
  assert.equal(parseBoolean(true), true);
  assert.equal(parseBoolean("false"), false);
  assert.throws(() => parseBoolean("yes"), /expected a boolean/);
});

test("validates and deduplicates component JSON", () => {
  assert.deepEqual(parseComponents('["api","api","worker"]'), ["api", "worker"]);
  assert.throws(() => parseComponents("api,worker"), /valid JSON/);
  assert.throws(() => parseComponents('["billing"]'), /unsupported component/);
});

test("builds a bounded matrix with one excluded runtime", () => {
  const matrix = buildMatrix(["api", "worker", "web"]);
  assert.equal(matrixSize(matrix), 5);
  assert.deepEqual(matrix.exclude, [{ component: "worker", node: "22" }]);
  assert.deepEqual(matrix.include, [{ component: "web", node: "24", experimental: true }]);
});

test("creates stable plans and keeps dry runs non-releasing", () => {
  const input = {
    environment: "staging",
    dryRun: "true",
    componentsJson: '["api","worker"]',
    revision: "abc123",
  };
  const first = createPlan(input);
  const second = createPlan(input);
  assert.deepEqual(first, second);
  assert.equal(first.should_release, false);
  assert.equal(first.plan_id.length, 12);
});

test("a non-dry-run production plan becomes release-eligible", () => {
  const plan = createPlan({
    environment: "production",
    dryRun: false,
    componentsJson: '["web"]',
    revision: "release-sha",
  });
  assert.equal(plan.should_release, true);
  assert.equal(matrixSize(plan.matrix), 2);
});

test("the service probe speaks the Redis PING protocol", async () => {
  const server = createServer((socket) => {
    socket.once("data", (request) => {
      assert.equal(request.toString("utf8"), "*1\r\n$4\r\nPING\r\n");
      socket.end("+PONG\r\n");
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address, "object");

  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/check-redis.mjs"], {
      cwd: fixtureDirectory,
      env: { ...process.env, REDIS_HOST: "127.0.0.1", REDIS_PORT: String(address.port) },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
  await new Promise((resolve) => server.close(resolve));

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /service responded/);
});
