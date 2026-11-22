import { defineStore } from 'pinia'
import { ref } from 'vue'

import { ApiHttpError, ApiNetworkError, isAbortError } from '@/api/apiError'
import { categoryApi } from '@/api/categoryApi'
import type { Category } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'
import type { Product, ProductListData, ProductListParams } from '@/api/productApi'
import type { CatalogFailure, CatalogResult } from '@/lib/catalogFailure'

export type { Category, Product, ProductListData, ProductListParams }

export type CategoriesState = 'idle' | 'loading' | 'ready' | 'error'

function toCatalogFailure(error: unknown): CatalogFailure {
  if (isAbortError(error)) return { kind: 'aborted' }
  if (error instanceof ApiNetworkError) return { kind: 'network' }
  if (error instanceof ApiHttpError) {
    if (error.code === 'NOT_FOUND') return { kind: 'notFound' }
    return error.status >= 500 ? { kind: 'network' } : { kind: 'unexpected' }
  }
  throw error
}

async function toResult<TValue>(load: () => Promise<TValue>): Promise<CatalogResult<TValue>> {
  try {
    return { ok: true, value: await load() }
  } catch (error) {
    return { ok: false, failure: toCatalogFailure(error) }
  }
}

export const useProductCatalogStore = defineStore('productCatalog', () => {
  const categories = ref<readonly Category[]>([])
  const categoriesState = ref<CategoriesState>('idle')
  const lastListRouteQuery = ref<Readonly<Record<string, string>>>({})

  function rememberListRouteQuery(routeQuery: Readonly<Record<string, string>>): void {
    lastListRouteQuery.value = { ...routeQuery }
  }

  async function loadCategories(): Promise<void> {
    if (categoriesState.value === 'loading' || categoriesState.value === 'ready') return
    categoriesState.value = 'loading'
    const result = await toResult(() => categoryApi.listCategories())
    if (result.ok) {
      categories.value = [...result.value]
      categoriesState.value = 'ready'
    } else {
      categoriesState.value = 'error'
    }
  }

  const fetchProductList = (params: ProductListParams, signal?: AbortSignal) =>
    toResult(() => productApi.listProducts(params, signal))

  const fetchProduct = (id: string, signal?: AbortSignal) =>
    toResult(() => productApi.getProduct(id, signal))

  return {
    categories,
    categoriesState,
    lastListRouteQuery,
    rememberListRouteQuery,
    loadCategories, fetchProductList,
    fetchProduct,
  }
})
