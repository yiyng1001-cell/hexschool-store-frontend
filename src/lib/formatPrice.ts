export function formatPrice(priceInTwd: number): string {
  if (!Number.isInteger(priceInTwd) || priceInTwd < 0) {
    throw new RangeError('price must be a non-negative integer')
  }
  return `NT$ ${priceInTwd.toLocaleString('en-US')}`
}
