import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { accessTokenStorage } from '@/api/accessTokenStorage'
import { apiClient, setUnauthorizedListener } from '@/api/apiClient'
import { useAuthStore } from '@/stores/authStore'

import { redirectToLoginOnSessionExpiry } from './sessionExpiry'

const Stub = { template: '<div />' }

function respondWith(status: number, code: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: { code, message: 'x' } }), { status }),
    ),
  )
}

async function buildRouterAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/cart', component: Stub },
      { path: '/login', name: 'login', component: Stub },
    ],
  })
  await router.push(path)
  return router
}

beforeEach(() => {
  window.localStorage.clear()
  setActivePinia(createPinia())
})

afterEach(() => {
  setUnauthorizedListener(null)
  vi.unstubAllGlobals()
})

describe('redirectToLoginOnSessionExpiry', () => {
  it('clears the session and redirects to login with the current path on UNAUTHORIZED', async () => {
    const router = await buildRouterAt('/cart?x=1')
    accessTokenStorage.write('token-1')
    redirectToLoginOnSessionExpiry(router)
    respondWith(401, 'UNAUTHORIZED')

    await expect(apiClient.request('GET', '/api/any')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/login'))

    expect(router.currentRoute.value.query.redirect).toBe('/cart?x=1')
    expect(useAuthStore().status).toBe('anonymous')
    expect(accessTokenStorage.read()).toBeNull()
  })

  it('does nothing for INVALID_CREDENTIALS', async () => {
    const router = await buildRouterAt('/')
    accessTokenStorage.write('token-1')
    redirectToLoginOnSessionExpiry(router)
    respondWith(401, 'INVALID_CREDENTIALS')

    await expect(apiClient.request('POST', '/api/auth/login')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })

    expect(router.currentRoute.value.path).toBe('/')
    expect(accessTokenStorage.read()).toBe('token-1')
  })
})
