import { describe, expect, it } from 'vitest'

import { sanitizeRedirectPath } from './sanitizeRedirectPath'

describe('sanitizeRedirectPath', () => {
  it.each(['/', '/products', '/products/abc?page=2&q=%E6%9D%AF', '/cart#top'])(
    'keeps the in-app path %s',
    (path) => {
      expect(sanitizeRedirectPath(path)).toBe(path)
    },
  )

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'products',
    '/path\nwith-newline',
    '',
  ])('falls back to "/" for %j', (value) => {
    expect(sanitizeRedirectPath(value)).toBe('/')
  })

  it.each([undefined, null, 42, ['/a'], {}])('falls back to "/" for non-string %j', (value) => {
    expect(sanitizeRedirectPath(value)).toBe('/')
  })

  it('falls back to "/" for auth pages to avoid a login loop', () => {
    expect(sanitizeRedirectPath('/login')).toBe('/')
    expect(sanitizeRedirectPath('/register?redirect=%2F')).toBe('/')
  })
})
