import { apiClient } from './apiClient'
import type { HttpClient } from './httpClient'
import type { components } from './types'

export type Cart = components['schemas']['Cart']
export type CartItem = components['schemas']['CartItem']

export interface CartApi {
  getCart(signal?: AbortSignal): Promise<Cart>
  setCartItemQuantity(productId: string, quantity: number): Promise<Cart>
  removeCartItem(productId: string): Promise<Cart>
}

function cartItemPath(productId: string): string {
  return `/api/cart/items/${encodeURIComponent(productId)}`
}

export function createCartApi(client: HttpClient): CartApi {
  return {
    async getCart(signal) {
      const data = await client.request<{ cart: Cart }>('GET', '/api/cart', { signal })
      return data.cart
    },
    async setCartItemQuantity(productId, quantity) {
      const data = await client.request<{ cart: Cart }>('PUT', cartItemPath(productId), {
        body: { quantity },
      })
      return data.cart
    },
    async removeCartItem(productId) {
      const data = await client.request<{ cart: Cart }>('DELETE', cartItemPath(productId))
      return data.cart
    },
  }
}

export const cartApi = createCartApi(apiClient)
