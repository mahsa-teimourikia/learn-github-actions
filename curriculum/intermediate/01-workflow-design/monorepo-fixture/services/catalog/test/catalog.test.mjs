import assert from "node:assert/strict";
import test from "node:test";
import { findSku } from "../src/catalog.mjs";

test("finds a known catalog item", () => {
  assert.deepEqual(findSku([{ sku: "A-1", cents: 2599 }], "A-1"), { sku: "A-1", cents: 2599 });
});

test("returns null for a missing item", () => {
  assert.equal(findSku([], "missing"), null);
});
