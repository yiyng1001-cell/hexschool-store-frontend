import { describe, expect, it } from 'vitest'

import { ApiHttpError, ApiNetworkError } from '@/api/apiError'

import { toAuthFailure } from './toAuthFailure'

const httpError = (status: number, code: ApiHttpError['code'], details: { field: string; message: string }[] = []) =>
  new ApiHttpError({ status, code, message: 'm', details })

describe('toAuthFailure', () => {
  it('maps credential, duplicate and network errors', () => {
    expect(toAuthFailure(httpError(401, 'INVALID_CREDENTIALS'))).toEqual({ kind: 'invalidCredentials' })
    expect(toAuthFailure(httpError(409, 'EMAIL_ALREADY_EXISTS'))).toEqual({ kind: 'emailAlreadyExists' })
    expect(toAuthFailure(new ApiNetworkError(new Error('x')))).toEqual({ kind: 'network' })
  })

  it('maps validation details to known fields only, first message wins', () => {
    const failure = toAuthFailure(
      httpError(400, 'VALIDATION_ERROR', [
        { field: 'password', message: 'first' },
        { field: 'password', message: 'second' },
        { field: 'role', message: '不允許的欄位' },
      ]),
    )
    expect(failure).toEqual({ kind: 'validation', fieldErrors: { password: 'first' } })
  })

  it('treats 5xx as a retryable network failure and other errors as unexpected', () => {
    expect(toAuthFailure(httpError(500, 'UNKNOWN_ERROR'))).toEqual({ kind: 'network' })
    expect(toAuthFailure(httpError(403, 'FORBIDDEN'))).toEqual({ kind: 'unexpected' })
  })

  it('rethrows programming errors instead of swallowing them', () => {
    expect(() => toAuthFailure(new TypeError('bug'))).toThrow(TypeError)
  })
})
