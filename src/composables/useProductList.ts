import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { CatalogFailure } from '@/lib/catalogFailure'
import { buildProductListRequest, parseProductListQuery, toRouteQuery } from '@/lib/productListQuery'
import type { ProductListQuery } from '@/lib/productListQuery'
import { useProductCatalogStore } from '@/stores/productCatalogStore'
import type { ProductListData } from '@/stores/productCatalogStore'

export type ProductListState =
  | { readonly status: 'loading'; readonly previous: ProductListData | null }
  | { readonly status: 'success'; readonly data: ProductListData }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly failure: CatalogFailure }

export type ProductFilterChange = Partial<Pick<ProductListQuery, 'category' | 'q' | 'sort'>>

export function useProductList() {
  const route = useRoute()
  const router = useRouter()
  const catalogStore = useProductCatalogStore()

  const state = ref<ProductListState>({ status: 'loading', previous: null })
  const parsed = computed(() => parseProductListQuery(route.query))
  const query = computed(() => parsed.value.query)
  let inFlight: AbortController | null = null

  function lastLoadedData(): ProductListData | null {
    const current = state.value
    if (current.status === 'success') return current.data
    return current.status === 'loading' ? current.previous : null
  }

  async function load(): Promise<void> {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    state.value = { status: 'loading', previous: lastLoadedData() }

    const result = await catalogStore.fetchProductList(
      buildProductListRequest(query.value),
      controller.signal,
    )
    if (controller !== inFlight) return

    if (!result.ok) {
      if (result.failure.kind !== 'aborted') state.value = { status: 'error', failure: result.failure }
      return
    }
    applyLoadedData(result.value)
  }

  function applyLoadedData(data: ProductListData): void {
    if (data.items.length > 0) {
      state.value = { status: 'success', data }
    } else if (data.meta.total > 0 && data.meta.totalPages > 0) {
      void router.replace({ query: toRouteQuery({ ...query.value, page: data.meta.totalPages }) })
    } else {
      state.value = { status: 'empty' }
    }
  }

  watch(
    () => route.query,
    () => {
      if (route.name !== 'products') return
      if (!parsed.value.isCanonical) {
        void router.replace({ query: toRouteQuery(parsed.value.query) })
        return
      }
      catalogStore.rememberListRouteQuery(toRouteQuery(parsed.value.query))
      void load()
    },
    { immediate: true },
  )

  onScopeDispose(() => inFlight?.abort())

  function applyFilters(change: ProductFilterChange): void {
    void router.push({ query: toRouteQuery({ ...query.value, ...change, page: 1 }) })
  }

  function goToPage(page: number): void {
    void router.push({ query: toRouteQuery({ ...query.value, page }) })
  }

  function clearFilters(): void {
    applyFilters({ category: null, q: null })
  }

  const hasActiveFilters = computed(() => query.value.category !== null || query.value.q !== null)

  return { state, query, hasActiveFilters, applyFilters, goToPage, clearFilters, retry: load }
}
