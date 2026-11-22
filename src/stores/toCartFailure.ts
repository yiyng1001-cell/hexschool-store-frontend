import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import type { CartFailure } from '@/lib/cartFailure'

export type CartOperation = 'load' | 'setQuantity' | 'remove'

function toValidationFailure(error: ApiHttpError): CartFailure {
  const cartFullDetail = error.details.find((detail) => detail.field === 'productId')
  return cartFullDetail
    ? { kind: 'cartFull', message: cartFullDetail.message }
    : { kind: 'invalidQuantity' }
}

export function toCartFailure(error: unknown, operation: CartOperation): CartFailure {
  if (error instanceof ApiNetworkError) return { kind: 'network' }
  if (!(error instanceof ApiHttpError)) throw error

  switch (error.code) {
    case 'UNAUTHORIZED':
      return { kind: 'unauthorized' }
    case 'NOT_FOUND':
      return operation === 'remove' ? { kind: 'itemNotInCart' } : { kind: 'productUnavailable' }
    case 'VALIDATION_ERROR':
      return toValidationFailure(error)
    default:
      return error.status >= 500 ? { kind: 'network' } : { kind: 'unexpected' }
  }
}
