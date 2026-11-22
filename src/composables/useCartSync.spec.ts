import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { accessTokenStorage } from '@/api/accessTokenStorage'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { cartApi } from '@/api/cartApi'
import type { Cart } from '@/api/cartApi'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))
vi.mock('@/api/cartApi', () => ({
  cartApi: { getCart: vi.fn(), setCartItemQuantity: vi.fn(), removeCartItem: vi.fn() },
}))

const userA: AuthUser = { id: 'a', email: 'a@example.com', name: 'A', role: 'USER', createdAt: '2026-11-21T10:00:00.000Z' }
const userB: AuthUser = { ...userA, id: 'b', email: 'b@example.com', name: 'B' }
const cartWith = (quantity: number): Cart => ({
  items: [
    {
      product: { id: 'p1', name: '商品', price: 100, imageUrl: 'https://images.example.com/a.jpg', category: { id: 'c', name: '家居' } },
      quantity,
      subtotal: 100 * quantity,
      available: true,
    },
  ],
  itemCount: 1,
  totalQuantity: quantity,
  totalPrice: 100 * quantity,
})

beforeEach(() => window.localStorage.clear())

describe('useCartSync', () => {
  it('does not call the cart api for anonymous visitors', async () => {
    await mountWithApp(App, '/')
    expect(cartApi.getCart).not.toHaveBeenCalled()
  })

  it('loads the cart after the session is restored and shows the badge', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(userA)
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWith(3))
    const { wrapper } = await mountWithApp(App, '/')
    expect(wrapper.get('nav [aria-label="購物車內有 3 件商品"]').text()).toBe('3')
  })

  it('hides the badge when the cart is empty', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(userA)
    vi.mocked(cartApi.getCart).mockResolvedValue({ items: [], itemCount: 0, totalQuantity: 0, totalPrice: 0 })
    const { wrapper } = await mountWithApp(App, '/')
    expect(wrapper.find('nav [aria-label^="購物車內有"]').exists()).toBe(false)
  })

  it('clears the cart on logout and loads the new account\'s cart after switching', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(userA)
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWith(3))
    const { wrapper, pinia } = await mountWithApp(App, '/')
    const cartStore = useCartStore(pinia)
    expect(cartStore.totalQuantity).toBe(3)

    useAuthStore(pinia).logout()
    await flushPromises()
    expect(cartStore.state.status).toBe('idle')
    expect(wrapper.find('nav [aria-label^="購物車內有"]').exists()).toBe(false)

    vi.mocked(authApi.loginUser).mockResolvedValue({ user: userB, accessToken: 'token-b' })
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWith(7))
    await useAuthStore(pinia).loginUser({ email: 'b@example.com', password: 'x' })
    await flushPromises()
    expect(cartStore.totalQuantity).toBe(7)
  })

  it('clears the cart when the session expires', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(userA)
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWith(3))
    const { pinia } = await mountWithApp(App, '/')

    useAuthStore(pinia).clearSession()
    await flushPromises()

    expect(useCartStore(pinia).state.status).toBe('idle')
  })
})
