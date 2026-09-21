const SUPPORTED_TIERS = new Set(["standard", "enterprise"]);

export function calculateRenewalQuote({ annualPrice, loyaltyYears, tier }) {
  if (!Number.isFinite(annualPrice) || annualPrice <= 0) {
    throw new TypeError("annualPrice must be a positive number");
  }
  if (!Number.isInteger(loyaltyYears) || loyaltyYears < 0) {
    throw new TypeError("loyaltyYears must be a non-negative integer");
  }
  if (!SUPPORTED_TIERS.has(tier)) {
    throw new TypeError(`unsupported tier: ${tier}`);
  }

  const loyaltyRate = loyaltyYears >= 5 ? 0.08 : loyaltyYears >= 2 ? 0.04 : 0;
  const enterpriseRate = tier === "enterprise" ? 0.03 : 0;
  const discountRate = Math.min(loyaltyRate + enterpriseRate, 0.11);
  const discount = Math.round(annualPrice * discountRate * 100) / 100;

  return {
    annualPrice,
    discount,
    discountRate,
    renewalTotal: Math.round((annualPrice - discount) * 100) / 100,
    tier,
  };
}
