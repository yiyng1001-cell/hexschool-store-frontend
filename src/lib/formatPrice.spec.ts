import { describe, expect, it } from 'vitest'

import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it.each([
    [1, 'NT$ 1'],
    [1200, 'NT$ 1,200'],
    [1000000, 'NT$ 1,000,000'],
  ])('formats %i', (price, expected) => {
    expect(formatPrice(price)).toBe(expected)
  })

  it.each([1.5, -1, Number.NaN])('rejects %f', (price) => {
    expect(() => formatPrice(price)).toThrow(RangeError)
  })
})
