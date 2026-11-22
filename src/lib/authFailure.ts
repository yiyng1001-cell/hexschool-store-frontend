export type AuthFormField = 'email' | 'password' | 'name'

export type AuthFieldErrors = Partial<Record<AuthFormField, string>>

export type AuthFailure =
  | { readonly kind: 'invalidCredentials' }
  | { readonly kind: 'emailAlreadyExists' }
  | { readonly kind: 'validation'; readonly fieldErrors: AuthFieldErrors }
  | { readonly kind: 'network' }
  | { readonly kind: 'unexpected' }

export type AuthResult = { readonly ok: true } | { readonly ok: false; readonly failure: AuthFailure }

export interface AuthFailureMessage {
  readonly fieldErrors: AuthFieldErrors
  readonly formError: string
}

export function describeAuthFailure(failure: AuthFailure): AuthFailureMessage {
  switch (failure.kind) {
    case 'invalidCredentials':
      return { fieldErrors: {}, formError: 'email 或密碼錯誤' }
    case 'emailAlreadyExists':
      return { fieldErrors: { email: '此 email 已被註冊' }, formError: '' }
    case 'validation':
      return { fieldErrors: { ...failure.fieldErrors }, formError: '' }
    case 'network':
      return { fieldErrors: {}, formError: '無法連線到伺服器，請檢查網路後重試' }
    case 'unexpected':
      return { fieldErrors: {}, formError: '發生未預期的錯誤，請稍後再試' }
  }
}
