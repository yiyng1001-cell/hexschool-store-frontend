import { describe, expect, it } from 'vitest'

import { calculateQuantityAfterAdd, canDecreaseQuantity, canIncreaseQuantity } from './cartRules'

describe('calculateQuantityAfterAdd', () => {
  it('starts at 1 for a product that is not in the cart', () => {
    expect(calculateQuantityAfterAdd(null)).toBe(1)
  })

  it('adds one to the current quantity', () => {
    expect(calculateQuantityAfterAdd(3)).toBe(4)
    expect(calculateQuantityAfterAdd(98)).toBe(99)
  })

  it('returns null once the per-item limit is reached', () => {
    expect(calculateQuantityAfterAdd(99)).toBeNull()
  })
})

describe('quantity bounds', () => {
  it.each([
    [1, true, false],
    [2, true, true],
    [98, true, true],
    [99, false, true],
  ])('quantity %i: increase=%s decrease=%s', (quantity, increase, decrease) => {
    expect(canIncreaseQuantity(quantity)).toBe(increase)
    expect(canDecreaseQuantity(quantity)).toBe(decrease)
  })
})
