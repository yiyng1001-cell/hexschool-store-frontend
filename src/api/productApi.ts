import { apiClient } from './apiClient'
import type { HttpClient } from './httpClient'
import type { components } from './types'

export type Product = components['schemas']['Product']
export type ProductListMeta = components['schemas']['ProductListMeta']
export type ProductListData = components['schemas']['ProductListResponse']['data']

export interface ProductListParams {
  readonly page: number
  readonly limit: number
  readonly sort: 'newest' | 'price_asc' | 'price_desc'
  readonly category?: string
  readonly q?: string
}

export interface ProductApi {
  listProducts(params: ProductListParams, signal?: AbortSignal): Promise<ProductListData>
  getProduct(id: string, signal?: AbortSignal): Promise<Product>
}

function toSearchString(params: ProductListParams): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value))
  })
  return search.toString()
}

export function createProductApi(client: HttpClient): ProductApi {
  return {
    listProducts(params, signal) {
      return client.request<ProductListData>('GET', `/api/products?${toSearchString(params)}`, {
        signal,
        requiresAuth: false,
      })
    },
    async getProduct(id, signal) {
      const data = await client.request<{ product: Product }>(
        'GET',
        `/api/products/${encodeURIComponent(id)}`,
        { signal, requiresAuth: false },
      )
      return data.product
    },
  }
}

export const productApi = createProductApi(apiClient)
