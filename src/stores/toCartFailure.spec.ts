import { describe, expect, it } from 'vitest'

import { ApiHttpError, ApiNetworkError } from '@/api/apiError'

import { toCartFailure } from './toCartFailure'

const httpError = (status: number, code: ApiHttpError['code'], details: { field: string; message: string }[] = []) =>
  new ApiHttpError({ status, code, message: 'm', details })

describe('toCartFailure', () => {
  it('maps 404 according to the operation', () => {
    expect(toCartFailure(httpError(404, 'NOT_FOUND'), 'setQuantity')).toEqual({ kind: 'productUnavailable' })
    expect(toCartFailure(httpError(404, 'NOT_FOUND'), 'remove')).toEqual({ kind: 'itemNotInCart' })
  })

  it('recognises a full cart by the productId detail and uses the backend message', () => {
    const error = httpError(400, 'VALIDATION_ERROR', [{ field: 'productId', message: '購物車已滿，最多 50 種商品' }])
    expect(toCartFailure(error, 'setQuantity')).toEqual({ kind: 'cartFull', message: '購物車已滿，最多 50 種商品' })
  })

  it('treats other validation errors as an invalid quantity', () => {
    const error = httpError(400, 'VALIDATION_ERROR', [{ field: 'quantity', message: 'x' }])
    expect(toCartFailure(error, 'setQuantity')).toEqual({ kind: 'invalidQuantity' })
  })

  it('maps auth, network and server errors', () => {
    expect(toCartFailure(httpError(401, 'UNAUTHORIZED'), 'load')).toEqual({ kind: 'unauthorized' })
    expect(toCartFailure(new ApiNetworkError(new Error('x')), 'load')).toEqual({ kind: 'network' })
    expect(toCartFailure(httpError(503, 'UNKNOWN_ERROR'), 'load')).toEqual({ kind: 'network' })
    expect(toCartFailure(httpError(403, 'FORBIDDEN'), 'load')).toEqual({ kind: 'unexpected' })
  })

  it('rethrows programming errors', () => {
    expect(() => toCartFailure(new TypeError('bug'), 'load')).toThrow(TypeError)
  })
})
