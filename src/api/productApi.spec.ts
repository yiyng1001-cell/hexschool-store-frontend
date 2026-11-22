import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from './httpClient'
import { createCategoryApi } from './categoryApi'
import { createProductApi } from './productApi'

const product = { id: 'p/1', name: 'n' }

function buildClient(data: unknown) {
  const request = vi.fn().mockResolvedValue(data)
  return { client: { request } as unknown as HttpClient, request }
}

describe('productApi', () => {
  it('sends only defined params as a query string, without auth', async () => {
    const { client, request } = buildClient({ items: [], meta: {} })
    const signal = new AbortController().signal

    await createProductApi(client).listProducts({ page: 2, limit: 12, sort: 'newest', q: '木 盒' }, signal)

    expect(request).toHaveBeenCalledWith('GET', '/api/products?page=2&limit=12&sort=newest&q=%E6%9C%A8+%E7%9B%92', {
      signal,
      requiresAuth: false,
    })
  })

  it('url-encodes the product id and unwraps the product', async () => {
    const { client, request } = buildClient({ product })

    const result = await createProductApi(client).getProduct('p/1')

    expect(request.mock.calls[0][1]).toBe('/api/products/p%2F1')
    expect(result).toEqual(product)
  })
})

describe('categoryApi', () => {
  it('unwraps the category items', async () => {
    const { client } = buildClient({ items: [{ id: 'c', name: '家居' }] })
    expect(await createCategoryApi(client).listCategories()).toEqual([{ id: 'c', name: '家居' }])
  })
})
