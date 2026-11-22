import { describe, expect, it } from 'vitest'

import { buildPaginationItems } from './buildPaginationItems'
import type { PaginationItem } from './buildPaginationItems'

const compact = (items: PaginationItem[]) => items.map((item) => (item.kind === 'page' ? item.page : '…'))

describe('buildPaginationItems', () => {
  it('returns nothing when there are no pages', () => {
    expect(buildPaginationItems(1, 0)).toEqual([])
  })

  it('lists every page when few', () => {
    expect(compact(buildPaginationItems(1, 1))).toEqual([1])
    expect(compact(buildPaginationItems(2, 5))).toEqual([1, 2, 3, 4, 5])
  })

  it('collapses the far ends with ellipses', () => {
    expect(compact(buildPaginationItems(10, 20))).toEqual([1, '…', 8, 9, 10, 11, 12, '…', 20])
  })

  it('collapses only one side near the edges', () => {
    expect(compact(buildPaginationItems(1, 20))).toEqual([1, 2, 3, '…', 20])
    expect(compact(buildPaginationItems(20, 20))).toEqual([1, '…', 18, 19, 20])
  })

  it('does not add an ellipsis for a gap of exactly one page', () => {
    expect(compact(buildPaginationItems(5, 9))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('rejects invalid input', () => {
    expect(() => buildPaginationItems(1.5, 3)).toThrow(RangeError)
    expect(() => buildPaginationItems(1, -1)).toThrow(RangeError)
  })
})
