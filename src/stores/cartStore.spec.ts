import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { cartApi } from '@/api/cartApi'
import type { Cart, CartItem } from '@/api/cartApi'

import { useCartStore } from './cartStore'

vi.mock('@/api/cartApi', () => ({
  cartApi: { getCart: vi.fn(), setCartItemQuantity: vi.fn(), removeCartItem: vi.fn() },
}))

const item = (id: string, quantity: number, available = true): CartItem => ({
  product: { id, name: `商品 ${id}`, price: 100, imageUrl: 'https://images.example.com/a.jpg', category: { id: 'c', name: '家居' } },
  quantity,
  subtotal: 100 * quantity,
  available,
})
const cartOf = (...items: CartItem[]): Cart => ({
  items,
  itemCount: items.length,
  totalQuantity: items.filter((entry) => entry.available).reduce((sum, entry) => sum + entry.quantity, 0),
  totalPrice: items.filter((entry) => entry.available).reduce((sum, entry) => sum + entry.subtotal, 0),
})
const httpError = (status: number, code: ApiHttpError['code'], details: { field: string; message: string }[] = []) =>
  new ApiHttpError({ status, code, message: 'm', details })

beforeEach(() => setActivePinia(createPinia()))

describe('loading', () => {
  it('goes idle → ready with the backend cart', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 2)))
    const store = useCartStore()
    expect(store.state.status).toBe('idle')
    await store.loadCart()
    expect(store.state.status).toBe('ready')
    expect(store.totalQuantity).toBe(2)
  })

  it('enters error on failure and keeps the previous cart when reloading', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValueOnce(cartOf(item('p1', 2)))
    const store = useCartStore()
    await store.loadCart()

    vi.mocked(cartApi.getCart).mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
    await store.loadCart()

    expect(store.state.status).toBe('error')
    expect(store.cart?.items).toHaveLength(1)
  })

  it('has no cart after a first-load failure', async () => {
    vi.mocked(cartApi.getCart).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const store = useCartStore()
    await store.loadCart()
    expect(store.state.status).toBe('error')
    expect(store.cart).toBeNull()
  })

  it('reset returns to idle and clears the cart', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    const store = useCartStore()
    await store.loadCart()
    store.reset()
    expect(store.state.status).toBe('idle')
    expect(store.cart).toBeNull()
  })

  it('ignores a load that finishes after reset (logout or account switch)', async () => {
    let resolveLoad: (cart: Cart) => void = () => undefined
    vi.mocked(cartApi.getCart).mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)))
    const store = useCartStore()
    const loading = store.loadCart()
    store.reset()
    resolveLoad(cartOf(item('old-user', 5)))
    await loading
    expect(store.state.status).toBe('idle')
  })
})

describe('addProduct', () => {
  it('sets quantity 1 for a new product and replaces state with the response', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(item('p1', 1)))
    const store = useCartStore()
    await store.loadCart()

    const result = await store.addProduct('p1')

    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 1)
    expect(result.ok).toBe(true)
    expect(store.quantityOf('p1')).toBe(1)
  })

  it('sends current + 1 for a product already in the cart', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 3)))
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(item('p1', 4)))
    const store = useCartStore()
    await store.loadCart()
    await store.addProduct('p1')
    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 4)
  })

  it('loads the cart first instead of overwriting an unknown quantity with 1', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 5)))
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(cartOf(item('p1', 6)))
    const store = useCartStore()

    await store.addProduct('p1')

    expect(cartApi.getCart).toHaveBeenCalledTimes(1)
    expect(cartApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 6)
  })

  it('does not send anything when the cart cannot be loaded', async () => {
    vi.mocked(cartApi.getCart).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const store = useCartStore()
    const result = await store.addProduct('p1')
    expect(result).toEqual({ ok: false, failure: { kind: 'cartNotLoaded' } })
    expect(cartApi.setCartItemQuantity).not.toHaveBeenCalled()
  })

  it('refuses to go past 99 without calling the backend', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 99)))
    const store = useCartStore()
    await store.loadCart()
    expect(await store.addProduct('p1')).toEqual({ ok: false, failure: { kind: 'quantityLimit' } })
    expect(cartApi.setCartItemQuantity).not.toHaveBeenCalled()
  })

  it('reports a full cart with the backend message and leaves the state untouched', async () => {
    const before = cartOf(item('p1', 1))
    vi.mocked(cartApi.getCart).mockResolvedValue(before)
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(
      httpError(400, 'VALIDATION_ERROR', [{ field: 'productId', message: '購物車已滿，最多 50 種商品' }]),
    )
    const store = useCartStore()
    await store.loadCart()

    const result = await store.addProduct('p2')

    expect(result).toEqual({ ok: false, failure: { kind: 'cartFull', message: '購物車已滿，最多 50 種商品' } })
    expect(store.cart).toEqual(before)
    expect(cartApi.getCart).toHaveBeenCalledTimes(1)
  })

  it('reloads the cart when the product turned out to be unavailable', async () => {
    vi.mocked(cartApi.getCart)
      .mockResolvedValueOnce(cartOf(item('p1', 1)))
      .mockResolvedValueOnce(cartOf(item('p1', 1, false)))
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(httpError(404, 'NOT_FOUND'))
    const store = useCartStore()
    await store.loadCart()

    const result = await store.addProduct('p1')

    expect(result).toEqual({ ok: false, failure: { kind: 'productUnavailable' } })
    expect(store.cart?.items[0]?.available).toBe(false)
    expect(store.totalQuantity).toBe(0)
  })

  it('does not change the cart on a network error', async () => {
    const before = cartOf(item('p1', 1))
    vi.mocked(cartApi.getCart).mockResolvedValue(before)
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const store = useCartStore()
    await store.loadCart()
    expect(await store.addProduct('p1')).toEqual({ ok: false, failure: { kind: 'network' } })
    expect(store.cart).toEqual(before)
  })
})

describe('setQuantity and removeItem', () => {
  it('updates from the backend response, never from local arithmetic', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    // The backend says the price changed: totals must follow the response.
    const fromBackend: Cart = { ...cartOf(item('p1', 3)), totalPrice: 999 }
    vi.mocked(cartApi.setCartItemQuantity).mockResolvedValue(fromBackend)
    const store = useCartStore()
    await store.loadCart()
    await store.setQuantity('p1', 3)
    expect(store.cart?.totalPrice).toBe(999)
  })

  it('removes an item and uses the returned cart', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1), item('p2', 1)))
    vi.mocked(cartApi.removeCartItem).mockResolvedValue(cartOf(item('p2', 1)))
    const store = useCartStore()
    await store.loadCart()
    await store.removeItem('p1')
    expect(store.cart?.items.map((entry) => entry.product.id)).toEqual(['p2'])
  })

  it('treats removing an item that is already gone as "not in cart" and reloads', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf())
    vi.mocked(cartApi.removeCartItem).mockRejectedValue(httpError(404, 'NOT_FOUND'))
    const store = useCartStore()
    await store.loadCart()
    expect(await store.removeItem('p1')).toEqual({ ok: false, failure: { kind: 'itemNotInCart' } })
    expect(cartApi.getCart).toHaveBeenCalledTimes(2)
  })

  it('reports 401 as unauthorized without touching the cart (the global handler logs out)', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    vi.mocked(cartApi.setCartItemQuantity).mockRejectedValue(httpError(401, 'UNAUTHORIZED'))
    const store = useCartStore()
    await store.loadCart()
    expect(await store.setQuantity('p1', 2)).toEqual({ ok: false, failure: { kind: 'unauthorized' } })
  })
})

describe('serialising mutations', () => {
  it('runs mutations one after another and applies the last response last', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1), item('p2', 1)))
    const order: string[] = []
    let releaseFirst: () => void = () => undefined
    vi.mocked(cartApi.setCartItemQuantity)
      .mockImplementationOnce(async () => {
        order.push('first:start')
        await new Promise<void>((resolve) => (releaseFirst = resolve))
        order.push('first:end')
        return cartOf(item('p1', 2), item('p2', 1))
      })
      .mockImplementationOnce(async () => {
        order.push('second:start')
        return cartOf(item('p1', 2), item('p2', 5))
      })
    const store = useCartStore()
    await store.loadCart()

    const first = store.setQuantity('p1', 2)
    const second = store.setQuantity('p2', 5)
    await Promise.resolve()
    expect(order).toEqual(['first:start'])

    releaseFirst()
    await Promise.all([first, second])

    expect(order).toEqual(['first:start', 'first:end', 'second:start'])
    expect(store.quantityOf('p2')).toBe(5)
    expect(store.quantityOf('p1')).toBe(2)
  })

  it('marks the product pending and rejects a duplicate click while it is in flight', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    let release: (cart: Cart) => void = () => undefined
    vi.mocked(cartApi.setCartItemQuantity).mockReturnValue(new Promise((resolve) => (release = resolve)))
    const store = useCartStore()
    await store.loadCart()

    const first = store.setQuantity('p1', 2)
    expect(store.pendingProductIds).toEqual(['p1'])
    expect(await store.setQuantity('p1', 3)).toEqual({ ok: false, failure: { kind: 'busy' } })

    release(cartOf(item('p1', 2)))
    await first
    expect(store.pendingProductIds).toEqual([])
    expect(cartApi.setCartItemQuantity).toHaveBeenCalledTimes(1)
  })

  it('discards a mutation response that arrives after reset', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    let release: (cart: Cart) => void = () => undefined
    vi.mocked(cartApi.setCartItemQuantity).mockReturnValue(new Promise((resolve) => (release = resolve)))
    const store = useCartStore()
    await store.loadCart()

    const pending = store.setQuantity('p1', 2)
    store.reset()
    release(cartOf(item('p1', 2)))
    await pending

    expect(store.state.status).toBe('idle')
  })

  it('keeps working after a failed mutation', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartOf(item('p1', 1)))
    vi.mocked(cartApi.setCartItemQuantity)
      .mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
      .mockResolvedValueOnce(cartOf(item('p1', 2)))
    const store = useCartStore()
    await store.loadCart()
    await store.setQuantity('p1', 2)
    await store.setQuantity('p1', 2)
    expect(store.quantityOf('p1')).toBe(2)
  })
})
