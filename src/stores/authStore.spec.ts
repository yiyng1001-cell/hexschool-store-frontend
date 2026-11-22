import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'

import { useAuthStore } from './authStore'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

const user: AuthUser = {
  id: 'u1',
  email: 'user@example.com',
  name: '小明',
  role: 'USER',
  createdAt: '2026-11-21T10:00:00.000Z',
}
const session = { user, accessToken: 'token-1' }
const httpError = (status: number, code: ApiHttpError['code']) =>
  new ApiHttpError({ status, code, message: 'm' })

beforeEach(() => {
  window.localStorage.clear()
  setActivePinia(createPinia())
})

describe('session restore', () => {
  it('becomes anonymous without calling the backend when no token is stored', async () => {
    const store = useAuthStore()
    await store.ensureSessionRestored()
    expect(store.status).toBe('anonymous')
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

  it('becomes authenticated when /me succeeds', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    const store = useAuthStore()
    await store.ensureSessionRestored()
    expect(store.status).toBe('authenticated')
    expect(store.currentUser).toEqual(user)
  })

  it('clears the token and becomes anonymous on 401 UNAUTHORIZED', async () => {
    accessTokenStorage.write('stale')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(httpError(401, 'UNAUTHORIZED'))
    const store = useAuthStore()
    await store.ensureSessionRestored()
    expect(store.status).toBe('anonymous')
    expect(accessTokenStorage.read()).toBeNull()
  })

  it.each([
    ['network error', new ApiNetworkError(new Error('x'))],
    ['5xx', httpError(503, 'UNKNOWN_ERROR')],
  ])('keeps the token and enters restoreFailed on %s', async (_label, error) => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(error)
    const store = useAuthStore()
    await store.ensureSessionRestored()
    expect(store.status).toBe('restoreFailed')
    expect(accessTokenStorage.read()).toBe('token-1')
  })

  it('shares one request between concurrent callers', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    const store = useAuthStore()
    await Promise.all([store.ensureSessionRestored(), store.ensureSessionRestored()])
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('recovers through retrySessionRestore and fails again when still unreachable', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const store = useAuthStore()
    await store.ensureSessionRestored()

    await store.retrySessionRestore()
    expect(store.status).toBe('restoreFailed')

    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    await store.retrySessionRestore()
    expect(store.status).toBe('authenticated')
  })

  it('ignores retry unless the restore failed', async () => {
    const store = useAuthStore()
    await store.ensureSessionRestored()
    await store.retrySessionRestore()
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

  it('does not swallow unexpected errors during restore', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new TypeError('bug'))
    const store = useAuthStore()
    await expect(store.ensureSessionRestored()).rejects.toBeInstanceOf(TypeError)
  })
})

describe('login and register', () => {
  it.each([
    ['loginUser', () => vi.mocked(authApi.loginUser)],
    ['registerUser', () => vi.mocked(authApi.registerUser)],
  ] as const)('%s stores the token and authenticates on success', async (method, getMock) => {
    getMock().mockResolvedValue(session)
    const store = useAuthStore()
    const result = await store[method]({ email: 'a@b.co', password: 'Passw0rd1', name: 'x' })
    expect(result).toEqual({ ok: true })
    expect(store.currentUser).toEqual(user)
    expect(accessTokenStorage.read()).toBe('token-1')
  })

  it('returns invalidCredentials without touching existing state', async () => {
    vi.mocked(authApi.loginUser).mockRejectedValue(httpError(401, 'INVALID_CREDENTIALS'))
    const store = useAuthStore()
    await store.ensureSessionRestored()
    const result = await store.loginUser({ email: 'a@b.co', password: 'x' })
    expect(result).toEqual({ ok: false, failure: { kind: 'invalidCredentials' } })
    expect(store.status).toBe('anonymous')
  })

  it('returns emailAlreadyExists for 409', async () => {
    vi.mocked(authApi.registerUser).mockRejectedValue(httpError(409, 'EMAIL_ALREADY_EXISTS'))
    const result = await useAuthStore().registerUser({ email: 'a@b.co', password: 'Passw0rd1', name: 'x' })
    expect(result).toEqual({ ok: false, failure: { kind: 'emailAlreadyExists' } })
  })
})

describe('logout and session expiry', () => {
  it('logout clears the token and user', async () => {
    vi.mocked(authApi.loginUser).mockResolvedValue(session)
    const store = useAuthStore()
    await store.loginUser({ email: 'a@b.co', password: 'x' })
    store.logout()
    expect(store.status).toBe('anonymous')
    expect(store.currentUser).toBeNull()
    expect(accessTokenStorage.read()).toBeNull()
  })
})
