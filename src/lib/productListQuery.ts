export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

export const PRODUCT_PAGE_SIZE = 12
export const SEARCH_KEYWORD_MAX_LENGTH = 50

export interface ProductListQuery {
  readonly page: number
  readonly category: string | null
  readonly q: string | null
  readonly sort: ProductSort
}

export interface ParsedProductListQuery {
  readonly query: ProductListQuery
  /** false when the URL held invalid or non-canonical values that should be rewritten. */
  readonly isCanonical: boolean
}

export interface ProductListRequest {
  readonly page: number
  readonly limit: number
  readonly category?: string
  readonly q?: string
  readonly sort: ProductSort
}

export const DEFAULT_PRODUCT_LIST_QUERY: ProductListQuery = {
  page: 1,
  category: null,
  q: null,
  sort: 'newest',
}

type RawQuery = Readonly<Record<string, unknown>>

function parsePage(raw: unknown): number {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return DEFAULT_PRODUCT_LIST_QUERY.page
  const page = Number(raw)
  return Number.isSafeInteger(page) ? page : DEFAULT_PRODUCT_LIST_QUERY.page
}

function parseCategory(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const category = raw.trim()
  return category === '' ? null : category
}

export function normalizeSearchKeyword(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const keyword = raw.trim()
  return keyword === '' || keyword.length > SEARCH_KEYWORD_MAX_LENGTH ? null : keyword
}

function parseSort(raw: unknown): ProductSort {
  return PRODUCT_SORTS.find((sort) => sort === raw) ?? DEFAULT_PRODUCT_LIST_QUERY.sort
}

/** Route query keys that carry no information (defaults) are omitted so URLs stay short and canonical. */
export function toRouteQuery(query: ProductListQuery): Record<string, string> {
  return {
    ...(query.page > 1 ? { page: String(query.page) } : {}),
    ...(query.category !== null ? { category: query.category } : {}),
    ...(query.q !== null ? { q: query.q } : {}),
    ...(query.sort !== DEFAULT_PRODUCT_LIST_QUERY.sort ? { sort: query.sort } : {}),
  }
}

const OWNED_KEYS = ['page', 'category', 'q', 'sort'] as const

function matchesCanonical(rawQuery: RawQuery, query: ProductListQuery): boolean {
  const canonical = toRouteQuery(query)
  return OWNED_KEYS.every((key) => {
    const raw = rawQuery[key]
    return raw === undefined ? canonical[key] === undefined : raw === canonical[key]
  })
}

export function parseProductListQuery(rawQuery: RawQuery): ParsedProductListQuery {
  const query: ProductListQuery = {
    page: parsePage(rawQuery.page),
    category: parseCategory(rawQuery.category),
    q: normalizeSearchKeyword(rawQuery.q),
    sort: parseSort(rawQuery.sort),
  }
  return { query, isCanonical: matchesCanonical(rawQuery, query) }
}

/** Only contract-defined parameters are sent: the backend rejects unknown ones and an empty `q`. */
export function buildProductListRequest(
  query: ProductListQuery,
  limit: number = PRODUCT_PAGE_SIZE,
): ProductListRequest {
  return {
    page: query.page,
    limit,
    sort: query.sort,
    ...(query.category !== null ? { category: query.category } : {}),
    ...(query.q !== null ? { q: query.q } : {}),
  }
}
