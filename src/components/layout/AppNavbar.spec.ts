import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/cartApi', () => ({
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ items: [], itemCount: 0, totalQuantity: 0, totalPrice: 0 }),
    setCartItemQuantity: vi.fn(),
    removeCartItem: vi.fn(),
  },
}))
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

beforeEach(() => {
  window.localStorage.clear()
})

describe('AppNavbar', () => {
  it('offers login and register to anonymous visitors', async () => {
    const { wrapper } = await mountWithApp(App, '/')
    const text = wrapper.get('nav').text()
    expect(text).toContain('登入')
    expect(text).toContain('註冊')
    expect(text).not.toContain('登出')
  })

  it('restores the session from the stored token and shows the user name', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    const { wrapper } = await mountWithApp(App, '/')
    expect(wrapper.get('nav').text()).toContain('小明')
    expect(wrapper.get('nav').text()).toContain('登出')
  })

  it('logs out without calling the backend, clears the token and survives a reload', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    const { wrapper } = await mountWithApp(App, '/')

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === '登出')
    await logoutButton?.trigger('click')
    await flushPromises()

    expect(accessTokenStorage.read()).toBeNull()
    expect(wrapper.get('nav').text()).toContain('登入')
    expect(authApi.loginUser).not.toHaveBeenCalled()

    vi.mocked(authApi.getCurrentUser).mockClear()
    const reloaded = await mountWithApp(App, '/')
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    expect(reloaded.wrapper.get('nav').text()).toContain('登入')
  })

  it('keeps the token and offers a retry when the session cannot be verified', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new ApiNetworkError(new Error('offline')))
    const { wrapper } = await mountWithApp(App, '/')

    expect(accessTokenStorage.read()).toBe('token-1')
    expect(wrapper.get('nav').text()).toContain('重試')

    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    const retry = wrapper.findAll('button').find((button) => button.text().includes('重試'))
    await retry?.trigger('click')
    await flushPromises()

    expect(wrapper.get('nav').text()).toContain('小明')
  })
  it('sends the visitor to login when a retry finds the stored token rejected on a protected page', async () => {
    accessTokenStorage.write('stale-token')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new ApiNetworkError(new Error('offline')))
    const { wrapper, router } = await mountWithApp(App, '/cart')
    expect(router.currentRoute.value.name).toBe('cart')

    vi.mocked(authApi.getCurrentUser).mockRejectedValue(
      new ApiHttpError({ status: 401, code: 'UNAUTHORIZED', message: 'expired' }),
    )
    const retry = wrapper.findAll('button').find((button) => button.text().includes('重試'))
    await retry?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/cart')
  })

  describe('mobile menu', () => {
    const menuButton = (wrapper: Awaited<ReturnType<typeof mountWithApp>>['wrapper']) =>
      wrapper.get('button[aria-controls="primary-menu"]')

    it('closes after navigating to another page', async () => {
      const { wrapper, router } = await mountWithApp(App, '/')
      await menuButton(wrapper).trigger('click')
      expect(menuButton(wrapper).attributes('aria-expanded')).toBe('true')

      await router.push('/products')
      await flushPromises()

      expect(menuButton(wrapper).attributes('aria-expanded')).toBe('false')
    })

    it('closes with Escape and returns focus to the menu button', async () => {
      const { wrapper } = await mountWithApp(App, '/')
      await menuButton(wrapper).trigger('click')

      await wrapper.get('nav').trigger('keydown', { key: 'Escape' })

      expect(menuButton(wrapper).attributes('aria-expanded')).toBe('false')
    })
  })
})
