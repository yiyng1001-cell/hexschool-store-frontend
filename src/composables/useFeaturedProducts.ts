import { onScopeDispose, ref } from 'vue'

import type { CatalogFailure } from '@/lib/catalogFailure'
import { buildProductListRequest, DEFAULT_PRODUCT_LIST_QUERY } from '@/lib/productListQuery'
import { useProductCatalogStore } from '@/stores/productCatalogStore'
import type { Product } from '@/stores/productCatalogStore'

const FEATURED_PRODUCT_COUNT = 8

export type FeaturedProductsState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly products: readonly Product[] }
  | { readonly status: 'error'; readonly failure: CatalogFailure }

/** "Featured" on the home page is simply the newest products; the backend has no featured flag. */
export function useFeaturedProducts() {
  const catalogStore = useProductCatalogStore()
  const state = ref<FeaturedProductsState>({ status: 'loading' })
  let inFlight: AbortController | null = null

  async function load(): Promise<void> {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    state.value = { status: 'loading' }

    const result = await catalogStore.fetchProductList(
      buildProductListRequest(DEFAULT_PRODUCT_LIST_QUERY, FEATURED_PRODUCT_COUNT),
      controller.signal,
    )
    if (controller !== inFlight) return

    if (result.ok) {
      state.value = { status: 'success', products: [...result.value.items] }
    } else if (result.failure.kind !== 'aborted') {
      state.value = { status: 'error', failure: result.failure }
    }
  }

  void load()
  onScopeDispose(() => inFlight?.abort())

  return { state, retry: load }
}
