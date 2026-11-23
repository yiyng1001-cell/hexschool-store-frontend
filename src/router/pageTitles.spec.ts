import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { categoryApi } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/productApi', () => ({ productApi: { listProducts: vi.fn(), getProduct: vi.fn() } }))
vi.mock('@/api/categoryApi', () => ({ categoryApi: { listCategories: vi.fn() } }))
vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(categoryApi.listCategories).mockResolvedValue([])
  vi.mocked(productApi.listProducts).mockResolvedValue({
    items: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
  })
})

describe('page titles and landmarks', () => {
  it('sets a title per route', async () => {
    const { router } = await mountWithApp(App, '/')
    expect(document.title).toBe('首頁 | 生活選物店')

    await router.push('/products')
    expect(document.title).toBe('商品列表 | 生活選物店')

    await router.push('/login')
    expect(document.title).toBe('登入 | 生活選物店')
  })

  it('uses the product name on the detail page once it has loaded', async () => {
    vi.mocked(productApi.getProduct).mockResolvedValue({
      id: 'p1',
      name: '木質收納盒',
      description: 'd',
      price: 580,
      imageUrl: 'https://images.example.com/a.jpg',
      category: { id: 'c', name: '收納' },
      createdAt: '2026-11-21T10:00:00.000Z',
      updatedAt: '2026-11-21T10:00:00.000Z',
    })
    await mountWithApp(App, '/products/p1')
    await flushPromises()

    expect(document.title).toBe('木質收納盒 | 生活選物店')
  })

  it('renders a footer landmark on every page', async () => {
    const { wrapper } = await mountWithApp(App, '/products')

    expect(wrapper.findAll('footer')).toHaveLength(1)
  })
})
