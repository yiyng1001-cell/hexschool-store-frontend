import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from './cartRules'

export type CartFailure =
  | { readonly kind: 'productUnavailable' }
  | { readonly kind: 'itemNotInCart' }
  | { readonly kind: 'cartFull'; readonly message: string | null }
  | { readonly kind: 'quantityLimit' }
  | { readonly kind: 'invalidQuantity' }
  | { readonly kind: 'cartNotLoaded' }
  | { readonly kind: 'busy' }
  | { readonly kind: 'unauthorized' }
  | { readonly kind: 'network' }
  | { readonly kind: 'unexpected' }

export type CartResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly failure: CartFailure }

/**
 * Failures after which the local cart may disagree with the backend and must be reloaded.
 * `network` and `unexpected` are included because the write may have been committed before the response was lost.
 */
export function shouldReloadAfter(failure: CartFailure): boolean {
  return (
    failure.kind === 'productUnavailable' ||
    failure.kind === 'itemNotInCart' ||
    failure.kind === 'invalidQuantity' ||
    failure.kind === 'network' ||
    failure.kind === 'unexpected'
  )
}

export function describeCartFailure(failure: CartFailure): string {
  switch (failure.kind) {
    case 'productUnavailable':
      return '商品已下架'
    case 'itemNotInCart':
      return '項目已不存在'
    case 'cartFull':
      return failure.message ?? `購物車已滿（最多 ${MAX_CART_ITEMS} 種商品）`
    case 'quantityLimit':
      return `已達單項上限（${MAX_ITEM_QUANTITY} 件）`
    case 'invalidQuantity':
      return '數量不正確，已重新載入購物車'
    case 'cartNotLoaded':
      return '無法載入購物車，請稍後再試'
    case 'busy':
      return ''
    case 'unauthorized':
      return ''
    case 'network':
      return '操作失敗，請檢查網路後重試'
    case 'unexpected':
      return '發生未預期的錯誤，請稍後再試'
  }
}
