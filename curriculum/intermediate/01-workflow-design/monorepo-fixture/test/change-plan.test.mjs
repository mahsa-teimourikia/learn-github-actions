import assert from "node:assert/strict";
import test from "node:test";
import { planChanges } from "../src/change-plan.mjs";

test("baseline selects every service", () => {
  const plan = planChanges([], { baseline: true });
  assert.deepEqual(plan.services, ["catalog", "checkout", "notifications"]);
  assert.equal(plan.metrics.jobsAvoided, 0);
});

test("documentation-only changes select no service", () => {
  const plan = planChanges(["README.md", "docs/ci.md"]);
  assert.deepEqual(plan.services, []);
  assert.equal(plan.metrics.jobsAvoided, 3);
});

test("catalog change includes its checkout dependent", () => {
  const plan = planChanges(["services/catalog/src/catalog.mjs"]);
  assert.deepEqual(plan.services, ["catalog", "checkout"]);
});

test("shared library change selects all dependents", () => {
  const plan = planChanges(["packages/shared/src/money.mjs"]);
  assert.deepEqual(plan.services, ["catalog", "checkout", "notifications"]);
});

test("unknown source paths fail closed", () => {
  const plan = planChanges(["tools/new-generator.mjs"]);
  assert.equal(plan.failSafe, true);
  assert.deepEqual(plan.services, ["catalog", "checkout", "notifications"]);
});

test("duplicate files do not duplicate matrix entries", () => {
  const plan = planChanges([
    "services/notifications/src/notify.mjs",
    "services/notifications/src/notify.mjs",
  ]);
  assert.deepEqual(plan.matrix.include, [
    { service: "notifications", directory: "services/notifications" },
  ]);
});

test("invalid input is rejected", () => {
  assert.throws(() => planChanges("services/catalog"), /array/);
});
