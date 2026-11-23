import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { ApiNetworkError } from '@/api/apiError'
import { categoryApi } from '@/api/categoryApi'
import { productApi } from '@/api/productApi'
import type { Product, ProductListData } from '@/api/productApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/productApi', () => ({ productApi: { listProducts: vi.fn(), getProduct: vi.fn() } }))
vi.mock('@/api/categoryApi', () => ({ categoryApi: { listCategories: vi.fn() } }))
vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

const makeProduct = (id: string, name: string): Product => ({
  id,
  name,
  description: `${name} 描述`,
  price: 1200,
  imageUrl: 'https://images.example.com/a.jpg',
  category: { id: 'c1', name: '家居' },
  createdAt: '2026-11-21T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
})

const page = (items: Product[], total = items.length, pageNumber = 1, totalPages = Math.ceil(total / 12)): ProductListData => ({
  items,
  meta: { page: pageNumber, limit: 12, total, totalPages },
})

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(categoryApi.listCategories).mockResolvedValue([
    { id: 'c1', name: '家居' },
    { id: 'c2', name: '文具' },
  ])
  window.scrollTo = vi.fn()
})

const lastRequest = () => vi.mocked(productApi.listProducts).mock.calls.at(-1)?.[0]

describe('ProductListView', () => {
  it('requests the default first page and renders products with formatted prices', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', '木質收納盒')], 1))
    const { wrapper } = await mountWithApp(App, '/products')

    expect(lastRequest()).toEqual({ page: 1, limit: 12, sort: 'newest' })
    expect(wrapper.text()).toContain('木質收納盒')
    expect(wrapper.text()).toContain('NT$ 1,200')
    expect(wrapper.find('article a').attributes('href')).toBe('/products/p1')
  })

  it('shows a skeleton while loading', async () => {
    vi.mocked(productApi.listProducts).mockReturnValue(new Promise(() => undefined))
    const { wrapper } = await mountWithApp(App, '/products')
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('article').exists()).toBe(false)
  })

  it('shows the empty state and clears filters', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([], 0, 1, 0))
    const { wrapper, router } = await mountWithApp(App, '/products?q=zzz&category=c1')

    expect(wrapper.text()).toContain('找不到符合條件的商品')
    const clear = wrapper.findAll('button').find((button) => button.text() === '清除條件')
    await clear?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
    expect(lastRequest()).toEqual({ page: 1, limit: 12, sort: 'newest' })
  })

  it('shows an error with retry, keeping the current conditions', async () => {
    vi.mocked(productApi.listProducts).mockRejectedValueOnce(new ApiNetworkError(new Error('x')))
    const { wrapper } = await mountWithApp(App, '/products?category=c1')
    expect(wrapper.get('[role="alert"]').text()).toContain('無法連線')

    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', '木質收納盒')], 1))
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('木質收納盒')
    expect(lastRequest()).toMatchObject({ category: 'c1' })
  })

  it('rewrites an invalid URL without sending the invalid request', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 1))
    const { router } = await mountWithApp(App, '/products?page=abc&sort=foo&q=%20%20')

    expect(router.currentRoute.value.query).toEqual({})
    expect(productApi.listProducts).toHaveBeenCalledTimes(1)
    expect(lastRequest()).toEqual({ page: 1, limit: 12, sort: 'newest' })
  })

  it('redirects to the last page when the page is out of range but results exist', async () => {
    vi.mocked(productApi.listProducts).mockImplementation(async (params) =>
      params.page === 9 ? page([], 24, 9, 2) : page([makeProduct('p1', '最後一頁商品')], 24, 2, 2),
    )
    const { wrapper, router } = await mountWithApp(App, '/products?page=9')

    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    expect(wrapper.text()).toContain('最後一頁商品')
  })

  it('changing a filter updates the URL and resets the page to 1', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 30, 3, 3))
    const { wrapper, router } = await mountWithApp(App, '/products?page=3')

    await wrapper.get('#product-category').setValue('c2')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ category: 'c2' })
    expect(lastRequest()).toMatchObject({ page: 1, category: 'c2' })
  })

  it('does not move focus to the heading when a filter resets the page', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 30, 3, 3))
    const { wrapper } = await mountWithApp(App, '/products?page=3')

    await wrapper.get('#product-category').setValue('c2')
    await flushPromises()

    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('moves focus to the heading after a pagination click', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 30, 1, 3))
    const { wrapper } = await mountWithApp(App, '/products')

    await wrapper.get('nav[aria-label="分頁"] button[aria-label="第 2 頁"]').trigger('click')
    await flushPromises()

    expect(focusSpy).toHaveBeenCalled()
  })

  it('searches on submit and omits q when cleared', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 1))
    const { wrapper } = await mountWithApp(App, '/products')

    await wrapper.get('#product-search').setValue('  木盒 ')
    await wrapper.get('form[role="search"]').trigger('submit')
    await flushPromises()
    expect(lastRequest()).toMatchObject({ q: '木盒' })

    await wrapper.get('#product-search').setValue('')
    await wrapper.get('form[role="search"]').trigger('submit')
    await flushPromises()
    expect('q' in (lastRequest() ?? {})).toBe(false)
  })

  it('debounces typing before searching', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 1))
      const { wrapper } = await mountWithApp(App, '/products')
      const callsBefore = vi.mocked(productApi.listProducts).mock.calls.length

      await wrapper.get('#product-search').setValue('木')
      await wrapper.get('#product-search').setValue('木盒')
      expect(productApi.listProducts).toHaveBeenCalledTimes(callsBefore)

      await vi.advanceTimersByTimeAsync(300)
      await flushPromises()
      expect(productApi.listProducts).toHaveBeenCalledTimes(callsBefore + 1)
      expect(lastRequest()).toMatchObject({ q: '木盒' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores a stale response that arrives after a newer one', async () => {
    let resolveFirst: (data: ProductListData) => void = () => undefined
    vi.mocked(productApi.listProducts)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(page([makeProduct('p2', '新條件商品')], 1))
    const { wrapper } = await mountWithApp(App, '/products')

    await wrapper.get('#product-sort').setValue('price_asc')
    await flushPromises()
    resolveFirst(page([makeProduct('p1', '舊條件商品')], 1))
    await flushPromises()

    expect(wrapper.text()).toContain('新條件商品')
    expect(wrapper.text()).not.toContain('舊條件商品')
  })

  it('keeps products visible when categories fail to load', async () => {
    vi.mocked(categoryApi.listCategories).mockRejectedValue(new ApiNetworkError(new Error('x')))
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', '木質收納盒')], 1))
    const { wrapper } = await mountWithApp(App, '/products')

    expect(wrapper.text()).toContain('木質收納盒')
    expect(wrapper.text()).toContain('分類載入失敗')
  })

  it('paginates via the nav and marks the current page', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 36, 1, 3))
    const { wrapper, router } = await mountWithApp(App, '/products')

    expect(wrapper.get('nav[aria-label="分頁"] [aria-current="page"]').text()).toBe('1')
    await wrapper.get('button[aria-label="第 2 頁"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    expect(lastRequest()).toMatchObject({ page: 2 })
  })

  it('hides pagination when there is a single page', async () => {
    vi.mocked(productApi.listProducts).mockResolvedValue(page([makeProduct('p1', 'a')], 1))
    const { wrapper } = await mountWithApp(App, '/products')
    expect(wrapper.find('nav[aria-label="分頁"]').exists()).toBe(false)
  })
})
