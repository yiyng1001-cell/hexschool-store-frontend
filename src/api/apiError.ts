import type { components } from './types'

export type BackendErrorCode = components['schemas']['ErrorCode']
export type ApiErrorCode = BackendErrorCode | 'UNKNOWN_ERROR'

export interface ApiFieldError {
  readonly field: string
  readonly message: string
}

export class ApiHttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: readonly ApiFieldError[]

  constructor(params: {
    status: number
    code: ApiErrorCode
    message: string
    details?: readonly ApiFieldError[]
  }) {
    super(params.message)
    this.name = 'ApiHttpError'
    this.status = params.status
    this.code = params.code
    this.details = [...(params.details ?? [])]
  }
}

export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause })
    this.name = 'ApiNetworkError'
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
