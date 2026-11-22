export const MIN_ITEM_QUANTITY = 1
export const MAX_ITEM_QUANTITY = 99
export const MAX_CART_ITEMS = 50

/** Quantity to send when adding one more; null when the item is already at the per-item limit. */
export function calculateQuantityAfterAdd(currentQuantity: number | null): number | null {
  const next = (currentQuantity ?? 0) + 1
  return next > MAX_ITEM_QUANTITY ? null : next
}

export function canIncreaseQuantity(quantity: number): boolean {
  return quantity < MAX_ITEM_QUANTITY
}

export function canDecreaseQuantity(quantity: number): boolean {
  return quantity > MIN_ITEM_QUANTITY
}
