export function total(items) {
  return items.reduce((sum, item) => sum + item.cents * item.quantity, 0);
}
