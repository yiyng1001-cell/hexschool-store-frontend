import { describe, expect, it } from 'vitest'

import { validateLoginForm, validateRegisterForm } from './validateAuthForm'

const validRegister = { name: '小明', email: 'user@example.com', password: 'Passw0rdOk' }

describe('validateRegisterForm', () => {
  it('accepts valid values', () => {
    expect(validateRegisterForm(validRegister)).toEqual({})
  })

  it('trims email and name before checking', () => {
    expect(validateRegisterForm({ ...validRegister, email: ' user@example.com ', name: ' 小明 ' })).toEqual({})
  })

  it.each(['', 'plain', 'a@b', 'a b@c.com'])('rejects email %j', (email) => {
    expect(validateRegisterForm({ ...validRegister, email }).email).toBeDefined()
  })

  it('rejects an email longer than 254 characters', () => {
    const email = `${'a'.repeat(250)}@b.co`
    expect(validateRegisterForm({ ...validRegister, email }).email).toBeDefined()
  })

  it.each([
    ['too short', 'Ab1'],
    ['letters only', 'abcdefgh'],
    ['digits only', '12345678'],
    ['too long', `a1${'x'.repeat(71)}`],
  ])('rejects a password that is %s', (_label, password) => {
    expect(validateRegisterForm({ ...validRegister, password }).password).toBeDefined()
  })

  it('accepts password length boundaries 8 and 72', () => {
    expect(validateRegisterForm({ ...validRegister, password: 'abcdefg1' }).password).toBeUndefined()
    expect(validateRegisterForm({ ...validRegister, password: `a1${'x'.repeat(70)}` }).password).toBeUndefined()
  })

  it.each(['', '   ', 'x'.repeat(51)])('rejects name %j', (name) => {
    expect(validateRegisterForm({ ...validRegister, name }).name).toBeDefined()
  })

  it('reports every invalid field at once', () => {
    expect(Object.keys(validateRegisterForm({ name: '', email: '', password: '' })).sort()).toEqual([
      'email',
      'name',
      'password',
    ])
  })
})

describe('validateLoginForm', () => {
  it('accepts a well-formed email and any non-empty password', () => {
    expect(validateLoginForm({ email: 'user@example.com', password: 'x' })).toEqual({})
  })

  it('rejects a missing email and password', () => {
    expect(validateLoginForm({ email: '', password: '' })).toEqual({
      email: expect.any(String),
      password: expect.any(String),
    })
  })
})
