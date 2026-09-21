import assert from "node:assert/strict";
import test from "node:test";
import { total } from "../src/checkout.mjs";

test("totals line items in integer cents", () => {
  assert.equal(total([{ cents: 1500, quantity: 2 }, { cents: 499, quantity: 1 }]), 3499);
});
