export function findSku(items, sku) {
  return items.find((item) => item.sku === sku) ?? null;
}
