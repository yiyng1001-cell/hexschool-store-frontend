import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { categoryApi } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'

import { useProductCatalogStore } from './productCatalogStore'

vi.mock('@/api/productApi', () => ({ productApi: { listProducts: vi.fn(), getProduct: vi.fn() } }))
vi.mock('@/api/categoryApi', () => ({ categoryApi: { listCategories: vi.fn() } }))

const params = { page: 1, limit: 12, sort: 'newest' as const }
const httpError = (status: number, code: ApiHttpError['code']) => new ApiHttpError({ status, code, message: 'm' })

beforeEach(() => setActivePinia(createPinia()))

describe('failure mapping', () => {
  it.each([
    ['network error', new ApiNetworkError(new Error('x')), 'network'],
    ['5xx', httpError(503, 'UNKNOWN_ERROR'), 'network'],
    ['404 NOT_FOUND', httpError(404, 'NOT_FOUND'), 'notFound'],
    ['400', httpError(400, 'VALIDATION_ERROR'), 'unexpected'],
    ['abort', new DOMException('x', 'AbortError'), 'aborted'],
  ])('maps %s', async (_label, error, kind) => {
    vi.mocked(productApi.getProduct).mockRejectedValue(error)
    const result = await useProductCatalogStore().fetchProduct('p1')
    expect(result).toEqual({ ok: false, failure: { kind } })
  })

  it('rethrows programming errors', async () => {
    vi.mocked(productApi.listProducts).mockRejectedValue(new TypeError('bug'))
    await expect(useProductCatalogStore().fetchProductList(params)).rejects.toBeInstanceOf(TypeError)
  })

  it('returns the value on success', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue({ items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } })
    const result = await useProductCatalogStore().fetchProductList(params)
    expect(result.ok).toBe(true)
  })
})

describe('loadCategories', () => {
  it('loads once and ignores later calls', async () => {
    vi.mocked(categoryApi.listCategories).mockResolvedValue([{ id: 'c', name: '家居' }])
    const store = useProductCatalogStore()
    await store.loadCategories()
    await store.loadCategories()
    expect(store.categoriesState).toBe('ready')
    expect(store.categories).toEqual([{ id: 'c', name: '家居' }])
    expect(categoryApi.listCategories).toHaveBeenCalledTimes(1)
  })

  it('can be retried after a failure', async () => {
    vi.mocked(categoryApi.listCategories).mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
    const store = useProductCatalogStore()
    await store.loadCategories()
    expect(store.categoriesState).toBe('error')

    vi.mocked(categoryApi.listCategories).mockResolvedValue([{ id: 'c', name: '家居' }])
    await store.loadCategories()
    expect(store.categoriesState).toBe('ready')
  })
})
