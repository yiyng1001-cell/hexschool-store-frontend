import { onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'

import type { CatalogFailure } from '@/lib/catalogFailure'
import { useProductCatalogStore } from '@/stores/productCatalogStore'
import type { Product } from '@/stores/productCatalogStore'

export type ProductDetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly product: Product }
  | { readonly status: 'error'; readonly failure: CatalogFailure }

export function useProductDetail(productId: Ref<string>) {
  const catalogStore = useProductCatalogStore()
  const state = ref<ProductDetailState>({ status: 'loading' })
  let inFlight: AbortController | null = null

  async function load(): Promise<void> {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    state.value = { status: 'loading' }

    const result = await catalogStore.fetchProduct(productId.value, controller.signal)
    if (controller !== inFlight) return

    if (result.ok) {
      state.value = { status: 'success', product: result.value }
    } else if (result.failure.kind !== 'aborted') {
      state.value = { status: 'error', failure: result.failure }
    }
  }

  watch(productId, () => void load(), { immediate: true })
  onScopeDispose(() => inFlight?.abort())

  return { state, retry: load }
}
