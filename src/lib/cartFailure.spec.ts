import { describe, expect, it } from 'vitest'

import { describeCartFailure, shouldReloadAfter } from './cartFailure'
import type { CartFailure } from './cartFailure'

describe('describeCartFailure', () => {
  it('prefers the backend message for a full cart and falls back to a default', () => {
    expect(describeCartFailure({ kind: 'cartFull', message: '購物車已滿，最多 50 種商品' })).toBe('購物車已滿，最多 50 種商品')
    expect(describeCartFailure({ kind: 'cartFull', message: null })).toContain('50')
  })

  it('has a message for every user-visible failure and none for silent ones', () => {
    const visible: CartFailure[] = [
      { kind: 'productUnavailable' },
      { kind: 'itemNotInCart' },
      { kind: 'quantityLimit' },
      { kind: 'invalidQuantity' },
      { kind: 'cartNotLoaded' },
      { kind: 'network' },
      { kind: 'unexpected' },
    ]
    visible.forEach((failure) => expect(describeCartFailure(failure)).not.toBe(''))
    expect(describeCartFailure({ kind: 'busy' })).toBe('')
    expect(describeCartFailure({ kind: 'unauthorized' })).toBe('')
  })
})

describe('shouldReloadAfter', () => {
  it('reloads only when the local cart may disagree with the backend', () => {
    expect(shouldReloadAfter({ kind: 'productUnavailable' })).toBe(true)
    expect(shouldReloadAfter({ kind: 'itemNotInCart' })).toBe(true)
    expect(shouldReloadAfter({ kind: 'invalidQuantity' })).toBe(true)
    expect(shouldReloadAfter({ kind: 'network' })).toBe(true)
    expect(shouldReloadAfter({ kind: 'unexpected' })).toBe(true)
    expect(shouldReloadAfter({ kind: 'unauthorized' })).toBe(false)
    expect(shouldReloadAfter({ kind: 'cartFull', message: null })).toBe(false)
  })
})
