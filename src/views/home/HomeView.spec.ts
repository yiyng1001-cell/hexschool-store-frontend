import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { ApiNetworkError } from '@/api/apiError'
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
  vi.mocked(categoryApi.listCategories).mockResolvedValue([{ id: 'c1', name: '家居' }])
})

describe('HomeView', () => {
  it('requests the 8 newest products and links categories to the filtered list', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue({
      items: [
        {
          id: 'p1',
          name: '木質收納盒',
          description: 'd',
          price: 580,
          imageUrl: 'https://images.example.com/box.jpg',
          category: { id: 'c1', name: '家居' },
          createdAt: '2026-11-21T10:00:00.000Z',
          updatedAt: '2026-11-21T10:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
    })
    const { wrapper } = await mountWithApp(App, '/')

    expect(productApi.listProducts).toHaveBeenCalledWith(
      { page: 1, limit: 8, sort: 'newest' },
      expect.any(AbortSignal),
    )
    expect(wrapper.text()).toContain('木質收納盒')
    const shortcut = wrapper.findAll('a').find((anchor) => anchor.text() === '家居' && anchor.attributes('href')?.includes('category'))
    expect(shortcut?.attributes('href')).toBe('/products?category=c1')
  })

  it('shows an error with retry when the products fail to load', async () => {
    vi.mocked(productApi.listProducts).mockRejectedValue(new ApiNetworkError(new Error('x')))
    const { wrapper } = await mountWithApp(App, '/')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('無法連線')
  })
})
