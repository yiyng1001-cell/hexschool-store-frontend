import { describe, expect, it, vi } from 'vitest'

import { createCartApi } from './cartApi'
import type { HttpClient } from './httpClient'

const cart = { items: [], itemCount: 0, totalQuantity: 0, totalPrice: 0 }

function buildClient() {
  const request = vi.fn().mockResolvedValue({ cart })
  return { client: { request } as unknown as HttpClient, request }
}

describe('cartApi', () => {
  it('gets the cart with the user token (default auth handling)', async () => {
    const { client, request } = buildClient()
    const signal = new AbortController().signal
    expect(await createCartApi(client).getCart(signal)).toEqual(cart)
    expect(request).toHaveBeenCalledWith('GET', '/api/cart', { signal })
  })

  it('sets a quantity with only { quantity } in the body and an encoded id', async () => {
    const { client, request } = buildClient()
    await createCartApi(client).setCartItemQuantity('p/1', 3)
    expect(request).toHaveBeenCalledWith('PUT', '/api/cart/items/p%2F1', { body: { quantity: 3 } })
  })

  it('removes an item', async () => {
    const { client, request } = buildClient()
    expect(await createCartApi(client).removeCartItem('p1')).toEqual(cart)
    expect(request).toHaveBeenCalledWith('DELETE', '/api/cart/items/p1')
  })
})
