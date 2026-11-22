import { describe, expect, it } from 'vitest'

import {
  buildProductListRequest,
  DEFAULT_PRODUCT_LIST_QUERY,
  normalizeSearchKeyword,
  parseProductListQuery,
  toRouteQuery,
} from './productListQuery'

describe('parseProductListQuery', () => {
  it('uses defaults and is canonical for an empty query', () => {
    expect(parseProductListQuery({})).toEqual({ query: DEFAULT_PRODUCT_LIST_QUERY, isCanonical: true })
  })

  it('parses valid values', () => {
    const { query, isCanonical } = parseProductListQuery({ page: '3', category: 'c1', q: 'box', sort: 'price_asc' })
    expect(query).toEqual({ page: 3, category: 'c1', q: 'box', sort: 'price_asc' })
    expect(isCanonical).toBe(true)
  })

  it.each(['abc', '0', '-1', '1.5', '01', '', '99999999999999999999'])(
    'falls back to page 1 and is non-canonical for page=%j',
    (page) => {
      const parsed = parseProductListQuery({ page })
      expect(parsed.query.page).toBe(1)
      expect(parsed.isCanonical).toBe(false)
    },
  )

  it('rejects an unknown sort and repeated (array) values', () => {
    expect(parseProductListQuery({ sort: 'foo' })).toMatchObject({ query: { sort: 'newest' }, isCanonical: false })
    expect(parseProductListQuery({ page: ['1', '2'] })).toMatchObject({ query: { page: 1 }, isCanonical: false })
  })

  it('drops blank and over-long keywords', () => {
    expect(parseProductListQuery({ q: '   ' })).toMatchObject({ query: { q: null }, isCanonical: false })
    expect(parseProductListQuery({ q: 'x'.repeat(51) })).toMatchObject({ query: { q: null }, isCanonical: false })
    expect(parseProductListQuery({ q: 'x'.repeat(50) }).query.q).toBe('x'.repeat(50))
  })

  it('treats explicit defaults (page=1, sort=newest) as non-canonical so the URL is shortened', () => {
    expect(parseProductListQuery({ page: '1' }).isCanonical).toBe(false)
    expect(parseProductListQuery({ sort: 'newest' }).isCanonical).toBe(false)
  })

  it('ignores unrelated query keys', () => {
    expect(parseProductListQuery({ utm_source: 'x' }).isCanonical).toBe(true)
  })
})

describe('normalizeSearchKeyword', () => {
  it('trims and returns null for blanks and non-strings', () => {
    expect(normalizeSearchKeyword('  木盒 ')).toBe('木盒')
    expect(normalizeSearchKeyword('')).toBeNull()
    expect(normalizeSearchKeyword(undefined)).toBeNull()
  })
})

describe('toRouteQuery', () => {
  it('omits default values', () => {
    expect(toRouteQuery(DEFAULT_PRODUCT_LIST_QUERY)).toEqual({})
    expect(toRouteQuery({ page: 2, category: 'c', q: 'k', sort: 'price_desc' })).toEqual({
      page: '2',
      category: 'c',
      q: 'k',
      sort: 'price_desc',
    })
  })
})

describe('buildProductListRequest', () => {
  it('omits q and category when absent and sends a fixed limit', () => {
    const request = buildProductListRequest(DEFAULT_PRODUCT_LIST_QUERY)
    expect(request).toEqual({ page: 1, limit: 12, sort: 'newest' })
    expect('q' in request).toBe(false)
    expect('category' in request).toBe(false)
  })

  it('includes only present filters and honours a custom limit', () => {
    expect(buildProductListRequest({ page: 2, category: 'c', q: 'k', sort: 'price_asc' }, 8)).toEqual({
      page: 2,
      limit: 8,
      sort: 'price_asc',
      category: 'c',
      q: 'k',
    })
  })
})
