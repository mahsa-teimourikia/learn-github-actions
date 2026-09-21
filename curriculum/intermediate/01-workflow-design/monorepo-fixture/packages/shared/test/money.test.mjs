import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney } from "../src/money.mjs";

test("formats integer cents", () => {
  assert.equal(formatMoney(2599), "$25.99");
});

test("rejects fractional cents", () => {
  assert.throws(() => formatMoney(25.5), /integer/);
});
