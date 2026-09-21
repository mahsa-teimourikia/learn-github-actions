export function formatMoney(cents, currency = "USD") {
  if (!Number.isInteger(cents)) throw new TypeError("cents must be an integer");
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
