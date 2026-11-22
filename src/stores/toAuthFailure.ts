import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import type { AuthFieldErrors, AuthFailure, AuthFormField } from '@/lib/authFailure'

const AUTH_FORM_FIELDS: readonly AuthFormField[] = ['email', 'password', 'name']

function toFieldErrors(error: ApiHttpError): AuthFieldErrors {
  return error.details.reduce<AuthFieldErrors>((collected, detail) => {
    const field = AUTH_FORM_FIELDS.find((candidate) => candidate === detail.field)
    return field === undefined || collected[field] !== undefined
      ? collected
      : { ...collected, [field]: detail.message }
  }, {})
}

export function toAuthFailure(error: unknown): AuthFailure {
  if (error instanceof ApiNetworkError) return { kind: 'network' }
  if (!(error instanceof ApiHttpError)) throw error

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return { kind: 'invalidCredentials' }
    case 'EMAIL_ALREADY_EXISTS':
      return { kind: 'emailAlreadyExists' }
    case 'VALIDATION_ERROR':
      return { kind: 'validation', fieldErrors: toFieldErrors(error) }
    default:
      return error.status >= 500 ? { kind: 'network' } : { kind: 'unexpected' }
  }
}
