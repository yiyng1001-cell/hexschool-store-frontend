import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiHttpError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { cartApi } from '@/api/cartApi'
import type { Cart, CartItem } from '@/api/cartApi'
import { categoryApi } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'
import type { Product } from '@/api/productApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))
vi.mock('@/api/cartApi', () => ({
  cartApi: { getCart: vi.fn(), setCartItemQuantity: vi.fn(), removeCartItem: vi.fn() },
}))
vi.mock('@/api/productApi', () => ({ productApi: { listProducts: vi.fn(), getProduct: vi.fn() } }))
vi.mock('@/api/categoryApi', () => ({ categoryApi: { listCategories: vi.fn() } }))

const user: AuthUser = { id: 'u1', email: 'user@example.com', name: '小明', role: 'USER', createdAt: '2026-11-21T10:00:00.000Z' }
const product: Product = {
  id: 'p1',
  name: '木質收納盒',
  description: 'd',
  price: 580,
  imageUrl: 'https://images.example.com/a.jpg',
  category: { id: 'c', name: '收納' },
  createdAt: '2026-11-21T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
}
const cartItem = (quantity: number): CartItem => ({
  product: { id: 'p1', name: product.name, price: 580, imageUrl: product.imageUrl, category: product.category },
  quantity,
  subtotal: 580 * quantity,
  available: true,
})
const cartOf = (...items: CartItem[]): Cart => ({
  items,
  itemCount: items.length,
  totalQuantity: items.reduce((sum, entry) => sum + entry.quantity, 0),
  totalPrice: items.reduce((sum, entry) => sum + entry.subtotal, 0),
})

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(categoryApi.listCategories).mockResolvedValue([])
  vi.mocked(productApi.listProducts).mockResolvedValue({ items: [product], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } })
  vi.mocked(productApi.getProduct).mockResolvedValue(product)
})

function signIn() {
  accessTokenStorage.write('token-1')
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(user)
}
const addButton = (wrapper: Awaited<ReturnType<typeof mountWithApp>>['wrapper']) =>
  wrapper.findAll('button').find((button) => /加入購物車|已達單項上限|加入中/.test(button.text()))

describe('AddToCartButton', () => {
  it('sends anonymous users to login with the current page as redirect, without calling the cart api', async () => {
    const { wrapper, router } = await mountWithApp(App, '/products')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/products')
    expect(wrapper.text()).toContain('請先登入')
    expect(cartApi.setCartItemQuantity).not.toHaveBeenCalled()
    expect(cartApi.getCart).not.toHaveBeenCalled()
  })

  it('adds with quantity 1, shows feedback with a link to the cart and updates the navbar badge', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(cartItem(1)))
    const { wrapper } = await mountWithApp(App, '/products')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 1)
    expect(wrapper.get('[role="status"]').text()).toContain('已加入購物車')
    expect(wrapper.get('[role="status"] a').attributes('href')).toBe('/cart')
    expect(wrapper.get('nav [aria-label="購物車內有 1 件商品"]').text()).toBe('1')
  })

  it('adds current + 1 when the product is already in the cart', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(cartItem(3)))
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(cartItem(4)))
    const { wrapper } = await mountWithApp(App, '/products/p1')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 4)
  })

  it('is disabled and labelled when the per-item limit is reached', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(cartItem(99)))
    const { wrapper } = await mountWithApp(App, '/products')

    const button = addButton(wrapper)
    expect(button?.text()).toBe('已達單項上限')
    expect(button?.attributes('disabled')).toBeDefined()
  })

  it('is disabled while the request is in flight', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.setCartItemQuantity).mockReturnValue(new Promise(() => undefined))
    const { wrapper } = await mountWithApp(App, '/products')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(addButton(wrapper)?.text()).toBe('加入中…')
    expect(addButton(wrapper)?.attributes('disabled')).toBeDefined()
  })

  it('shows the backend message when the cart is full', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(
      new ApiHttpError({ status: 400, code: 'VALIDATION_ERROR', message: 'x', details: [{ field: 'productId', message: '購物車已滿，最多 50 種商品' }] }),
    )
    const { wrapper } = await mountWithApp(App, '/products')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('購物車已滿，最多 50 種商品')
  })

  it('shows a "product gone" message when the product was removed', async () => {
    signIn()
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(new ApiHttpError({ status: 404, code: 'NOT_FOUND', message: 'x' }))
    const { wrapper } = await mountWithApp(App, '/products')

    await addButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('商品已下架')
  })
})
