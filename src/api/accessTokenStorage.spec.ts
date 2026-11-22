import { describe, expect, it, vi } from 'vitest'

import { createAccessTokenStorage } from './accessTokenStorage'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

describe('createAccessTokenStorage', () => {
  it('writes, reads and clears the token', () => {
    const storage = createAccessTokenStorage(memoryStorage())
    expect(storage.read()).toBeNull()
    storage.write('abc')
    expect(storage.read()).toBe('abc')
    storage.clear()
    expect(storage.read()).toBeNull()
  })

  it('treats a missing storage as logged out', () => {
    const storage = createAccessTokenStorage(null)
    storage.write('abc')
    expect(storage.read()).toBeNull()
  })

  it('degrades gracefully, without logging the token, when storage throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const storage = createAccessTokenStorage(blocked)

    expect(storage.read()).toBeNull()
    storage.write('secret-token')
    storage.clear()

    expect(warn).toHaveBeenCalledTimes(3)
    expect(JSON.stringify(warn.mock.calls)).not.toContain('secret-token')
  })
})
