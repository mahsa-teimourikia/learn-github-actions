import assert from "node:assert/strict";
import test from "node:test";
import { receiptSubject } from "../src/notify.mjs";

test("builds a stable receipt subject", () => {
  assert.equal(receiptSubject("order-42"), "Receipt for order-42");
});

test("rejects a missing order identifier", () => {
  assert.throws(() => receiptSubject(""), /required/);
});
