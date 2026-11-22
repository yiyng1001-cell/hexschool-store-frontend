import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiNetworkError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { useAuthStore } from '@/stores/authStore'

import { authNavigationGuard } from './authGuards'

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

function routeTo(meta: Record<string, boolean>, fullPath = '/cart'): RouteLocationNormalized {
  return { meta, fullPath } as unknown as RouteLocationNormalized
}

beforeEach(() => {
  window.localStorage.clear()
  setActivePinia(createPinia())
})

describe('authNavigationGuard', () => {
  it('waits for the session restore before deciding', async () => {
    const store = useAuthStore()
    const ensure = vi.spyOn(store, 'ensureSessionRestored')
    await authNavigationGuard(routeTo({}))
    expect(ensure).toHaveBeenCalledOnce()
  })

  it('sends anonymous users away from requiresAuth routes with a redirect', async () => {
    const result = await authNavigationGuard(routeTo({ requiresAuth: true }, '/cart?x=1'))
    expect(result).toEqual({ name: 'login', query: { redirect: '/cart?x=1' } })
  })

  it('lets anonymous users reach guest-only routes', async () => {
    expect(await authNavigationGuard(routeTo({ guestOnly: true }, '/login'))).toBe(true)
  })

  it('sends authenticated users away from guest-only routes', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    expect(await authNavigationGuard(routeTo({ guestOnly: true }, '/login'))).toEqual({ name: 'home' })
  })

  it('lets authenticated users reach requiresAuth routes', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    expect(await authNavigationGuard(routeTo({ requiresAuth: true }))).toBe(true)
  })

  it('does not log the user out when the restore failed', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new ApiNetworkError(new Error('x')))
    expect(await authNavigationGuard(routeTo({ requiresAuth: true }))).toBe(true)
    expect(useAuthStore().status).toBe('restoreFailed')
    expect(accessTokenStorage.read()).toBe('token-1')
  })
})
