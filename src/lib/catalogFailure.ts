export type CatalogFailure =
  | { readonly kind: 'network' }
  | { readonly kind: 'notFound' }
  | { readonly kind: 'unexpected' }
  | { readonly kind: 'aborted' }

export type CatalogResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly failure: CatalogFailure }

export function describeCatalogFailure(failure: CatalogFailure): string {
  switch (failure.kind) {
    case 'network':
      return '無法連線到伺服器，請檢查網路後重試'
    case 'notFound':
      return '商品不存在或已下架'
    case 'unexpected':
      return '載入失敗，請稍後再試'
    case 'aborted':
      return ''
  }
}
