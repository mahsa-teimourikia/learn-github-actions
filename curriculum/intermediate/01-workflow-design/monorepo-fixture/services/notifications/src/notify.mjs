export function receiptSubject(orderId) {
  if (!orderId) throw new Error("orderId is required");
  return `Receipt for ${orderId}`;
}
