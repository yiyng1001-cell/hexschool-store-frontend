import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { cartApi } from '@/api/cartApi'
import type { Cart, CartItem } from '@/api/cartApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))
vi.mock('@/api/cartApi', () => ({
  cartApi: { getCart: vi.fn(), setCartItemQuantity: vi.fn(), removeCartItem: vi.fn() },
}))

const user: AuthUser = { id: 'u1', email: 'user@example.com', name: '小明', role: 'USER', createdAt: '2026-11-21T10:00:00.000Z' }
const item = (id: string, quantity: number, available = true): CartItem => ({
  product: { id, name: `商品${id}`, price: 100, imageUrl: 'https://images.example.com/a.jpg', category: { id: 'c', name: '家居' } },
  quantity,
  subtotal: 100 * quantity,
  available,
})
const cartOf = (...items: CartItem[]): Cart => {
  const buyable = items.filter((entry) => entry.available)
  return {
    items,
    itemCount: items.length,
    totalQuantity: buyable.reduce((sum, entry) => sum + entry.quantity, 0),
    totalPrice: buyable.reduce((sum, entry) => sum + entry.subtotal, 0),
  }
}

function signIn() {
  accessTokenStorage.write('token-1')
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('CartView', () => {
  it('sends anonymous visitors to the login page and returns them afterwards', async () => {
    const { router } = await mountWithApp(App, '/cart')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/cart')
  })

  it('shows a skeleton while loading', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockReturnValue(new Promise(() => undefined))
    const { wrapper } = await mountWithApp(App, '/cart')
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('shows an empty state that links to the products', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    const { wrapper } = await mountWithApp(App, '/cart')
    expect(wrapper.text()).toContain('購物車是空的')
    expect(wrapper.find('a[href="/products"]').exists()).toBe(true)
  })

  it('shows an error with retry when the first load fails', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
    const { wrapper } = await mountWithApp(App, '/cart')
    expect(wrapper.get('[role="alert"]').text()).toContain('無法載入購物車')

    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2)))
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('商品p1')
  })

  it('renders items and the totals exactly as the backend returned them', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue({ ...cartOf(item('p1', 2)), totalPrice: 777 })
    const { wrapper } = await mountWithApp(App, '/cart')
    expect(wrapper.get('section[aria-label="購物車總計"]').text()).toContain('NT$ 777')
    expect(wrapper.get('output').text()).toBe('2')
  })

  it('changes the quantity through the backend and shows the response', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2)))
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(item('p1', 3)))
    const { wrapper } = await mountWithApp(App, '/cart')

    await wrapper.get('button[aria-label="增加 商品p1 的數量"]').trigger('click')
    await flushPromises()

    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 3)
    expect(wrapper.get('output').text()).toBe('3')
    expect(wrapper.get('[role="status"]').text()).toContain('已更新數量')
  })

  it('does not change the screen when a change fails', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2)))
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const { wrapper } = await mountWithApp(App, '/cart')

    await wrapper.get('button[aria-label="增加 商品p1 的數量"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('output').text()).toBe('2')
    expect(wrapper.get('[role="alert"]').text()).toContain('操作失敗')
  })

  it('disables − at 1 and + at 99', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1), item('p2', 99)))
    const { wrapper } = await mountWithApp(App, '/cart')
    expect(wrapper.get('button[aria-label="減少 商品p1 的數量"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="增加 商品p2 的數量"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="增加 商品p1 的數量"]').attributes('disabled')).toBeUndefined()
  })

  it('removes an item and shows the returned cart', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1), item('p2', 1)))
    vi.mocked(cartApi.removeCartItem).mockResolvedValue(cartOf(item('p2', 1)))
    const { wrapper } = await mountWithApp(App, '/cart')

    await wrapper.get('button[aria-label="移除 商品p1"]').trigger('click')
    await flushPromises()

    expect(cartApi.removeCartItem).toHaveBeenCalledWith('p1')
    expect(wrapper.text()).not.toContain('商品p1')
    expect(wrapper.text()).toContain('商品p2')
  })

  it('shows unavailable items as 已下架, removable only and excluded from the totals', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2), item('p2', 3, false)))
    const { wrapper } = await mountWithApp(App, '/cart')

    expect(wrapper.text()).toContain('已下架')
    expect(wrapper.find('button[aria-label="增加 商品p2 的數量"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="移除 商品p2"]').exists()).toBe(true)
    expect(wrapper.get('section[aria-label="購物車總計"]').text()).toContain('2 件')
    expect(wrapper.find('a[href="/products/p2"]').exists()).toBe(false)
  })

  it('reloads and tells the user when an item disappeared on the backend', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValueOnce(cartOf(item('p1', 1))).mockResolvedValue(cartOf())
    vi.mocked(cartApi.removeCartItem).mockRejectedValue(new ApiHttpError({ status: 404, code: 'NOT_FOUND', message: 'x' }))
    const { wrapper } = await mountWithApp(App, '/cart')

    await wrapper.get('button[aria-label="移除 商品p1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('項目已不存在')
    expect(wrapper.text()).toContain('購物車是空的')
  })

  it('disables the controls of the row being changed and ignores double clicks', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2)))
    let release: (cart: Cart) => void = () => undefined
    vi.mocked(cartApi.setCartItemQuantity).mockReturnValue(new Promise((resolve) => (release = resolve)))
    const { wrapper } = await mountWithApp(App, '/cart')

    await wrapper.get('button[aria-label="增加 商品p1 的數量"]').trigger('click')
    expect(wrapper.get('button[aria-label="增加 商品p1 的數量"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="移除 商品p1"]').attributes('disabled')).toBeDefined()

    release(cartOf(item('p1', 3)))
    await flushPromises()
    expect(cartApi.setCartItemQuantity).toHaveBeenCalledTimes(1)
  })

  it('shows the retry screen, keeps the token, when the session cannot be verified', async () => {
    accessTokenStorage.write('token-1')
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new ApiNetworkError(new Error('offline')))
    const { wrapper, router } = await mountWithApp(App, '/cart')

    expect(router.currentRoute.value.name).toBe('cart')
    expect(wrapper.text()).toContain('無法確認登入狀態')
    expect(accessTokenStorage.read()).toBe('token-1')
    expect(cartApi.getCart).not.toHaveBeenCalled()

    vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    await wrapper.findAll('button').find((button) => button.text() === '重試')?.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('商品p1')
  })
})
