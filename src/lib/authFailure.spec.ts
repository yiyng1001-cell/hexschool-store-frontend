import { describe, expect, it } from 'vitest'

import { describeAuthFailure } from './authFailure'

describe('describeAuthFailure', () => {
  it('shows invalid credentials as a form-level error', () => {
    expect(describeAuthFailure({ kind: 'invalidCredentials' })).toEqual({
      fieldErrors: {},
      formError: 'email 或密碼錯誤',
    })
  })

  it('shows a duplicated email on the email field', () => {
    expect(describeAuthFailure({ kind: 'emailAlreadyExists' }).fieldErrors).toEqual({
      email: '此 email 已被註冊',
    })
  })

  it('passes backend field errors through without mutating the input', () => {
    const fieldErrors = { password: '至少 8 字元' }
    const message = describeAuthFailure({ kind: 'validation', fieldErrors })
    expect(message.fieldErrors).toEqual(fieldErrors)
    expect(message.fieldErrors).not.toBe(fieldErrors)
  })

  it.each(['network', 'unexpected'] as const)('gives a retryable form error for %s', (kind) => {
    expect(describeAuthFailure({ kind }).formError).not.toBe('')
  })
})
