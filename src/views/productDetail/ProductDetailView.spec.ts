import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { categoryApi } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'
import type { Product } from '@/api/productApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/productApi', () => ({ productApi: { listProducts: vi.fn(), getProduct: vi.fn() } }))
vi.mock('@/api/categoryApi', () => ({ categoryApi: { listCategories: vi.fn() } }))
vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

const product: Product = {
  id: 'p1',
  name: '木質收納盒',
  description: '桌面小物收納，天然橡木。',
  price: 580,
  imageUrl: 'https://images.example.com/box.jpg',
  category: { id: 'c1', name: '收納' },
  createdAt: '2026-11-21T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
}

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(categoryApi.listCategories).mockResolvedValue([])
})

describe('ProductDetailView', () => {
  it('renders the product with a semantic article and responsive image', async () => {
    vi.mocked(productApi.getProduct).mockResolvedValue(product)
    const { wrapper } = await mountWithApp(App, '/products/p1')

    expect(productApi.getProduct).toHaveBeenCalledWith('p1', expect.any(AbortSignal))
    expect(wrapper.get('article h1').text()).toBe('木質收納盒')
    expect(wrapper.text()).toContain('NT$ 580')
    expect(wrapper.get('img').attributes('alt')).toBe('木質收納盒')
  })

  it('shows a friendly message for 404 NOT_FOUND', async () => {
    vi.mocked(productApi.getProduct).mockRejectedValue(
      new ApiHttpError({ status: 404, code: 'NOT_FOUND', message: 'x' }),
    )
    const { wrapper } = await mountWithApp(App, '/products/missing')
    expect(wrapper.text()).toContain('商品不存在或已下架')
  })

  it('shows an error and recovers on retry', async () => {
    vi.mocked(productApi.getProduct).mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
    const { wrapper } = await mountWithApp(App, '/products/p1')
    expect(wrapper.get('[role="alert"]').text()).toContain('無法連線')

    vi.mocked(productApi.getProduct).mockResolvedValue(product)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('article h1').text()).toBe('木質收納盒')
  })

  it('links back to the list with the previously used conditions', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue({
      items: [product],
      meta: { page: 2, limit: 12, total: 24, totalPages: 2 },
    })
    vi.mocked(productApi.getProduct).mockResolvedValue(product)
    const { wrapper, router } = await mountWithApp(App, '/products?category=c1&page=2')

    await router.push('/products/p1')
    await flushPromises()

    const back = wrapper.findAll('a').find((anchor) => anchor.text().includes('回到商品列表'))
    expect(back?.attributes('href')).toBe('/products?page=2&category=c1')
  })
})
