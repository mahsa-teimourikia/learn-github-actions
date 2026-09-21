import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateRenewalQuote } from "../src/renewal-policy.mjs";

describe("calculateRenewalQuote", () => {
  it("applies the combined enterprise and long-term loyalty rate", () => {
    assert.deepEqual(
      calculateRenewalQuote({ annualPrice: 12000, loyaltyYears: 6, tier: "enterprise" }),
      {
        annualPrice: 12000,
        discount: 1320,
        discountRate: 0.11,
        renewalTotal: 10680,
        tier: "enterprise",
      },
    );
  });

  it("does not discount a new standard account", () => {
    assert.equal(
      calculateRenewalQuote({ annualPrice: 1200, loyaltyYears: 0, tier: "standard" }).renewalTotal,
      1200,
    );
  });

  it("rejects an unknown tier instead of silently applying a default", () => {
    assert.throws(
      () => calculateRenewalQuote({ annualPrice: 1200, loyaltyYears: 2, tier: "partner" }),
      /unsupported tier/,
    );
  });

  it("rejects invalid prices at the trusted calculation boundary", () => {
    assert.throws(
      () => calculateRenewalQuote({ annualPrice: -1, loyaltyYears: 2, tier: "standard" }),
      /annualPrice/,
    );
  });
});
