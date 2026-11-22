import type { AuthFieldErrors } from './authFailure'

export interface LoginFormValues {
  readonly email: string
  readonly password: string
}

export interface RegisterFormValues extends LoginFormValues {
  readonly name: string
}

const EMAIL_MAX_LENGTH = 254
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_BYTES = 72
const NAME_MAX_LENGTH = 50

function validateEmail(rawEmail: string): string | undefined {
  const email = rawEmail.trim()
  if (email === '') return '請輸入 email'
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return 'email 格式不正確'
  return undefined
}

/** The backend limits passwords by UTF-8 bytes (bcrypt input limit), so multi-byte characters count 3 each. */
function countUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}

function validateNewPassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) return `密碼至少 ${PASSWORD_MIN_LENGTH} 字元`
  if (countUtf8Bytes(password) > PASSWORD_MAX_BYTES) {
    return `密碼最多 ${PASSWORD_MAX_BYTES} bytes（中文等多位元組字元每字佔 3 bytes）`
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '密碼需同時包含英文與數字'
  return undefined
}

function validateName(rawName: string): string | undefined {
  const name = rawName.trim()
  if (name === '') return '請輸入名稱'
  if (name.length > NAME_MAX_LENGTH) return `名稱最長 ${NAME_MAX_LENGTH} 字元`
  return undefined
}

function dropUndefinedEntries(candidate: AuthFieldErrors): AuthFieldErrors {
  return Object.fromEntries(
    Object.entries(candidate).filter(([, message]) => message !== undefined),
  ) as AuthFieldErrors
}

export function validateLoginForm(values: LoginFormValues): AuthFieldErrors {
  return dropUndefinedEntries({
    email: validateEmail(values.email),
    password: values.password === '' ? '請輸入密碼' : undefined,
  })
}

export function validateRegisterForm(values: RegisterFormValues): AuthFieldErrors {
  return dropUndefinedEntries({
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    name: validateName(values.name),
  })
}
