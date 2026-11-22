import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PaginationNav from './PaginationNav.vue'

describe('PaginationNav', () => {
  it('renders nothing for a single page', () => {
    expect(mount(PaginationNav, { props: { page: 1, totalPages: 1 } }).find('nav').exists()).toBe(false)
  })

  it('marks only the current page and gives it a distinct, non-white background', () => {
    const wrapper = mount(PaginationNav, { props: { page: 2, totalPages: 5 } })
    const current = wrapper.get('[aria-current="page"]')

    expect(current.text()).toBe('2')
    expect(current.classes()).toContain('bg-indigo-600')
    expect(current.classes()).toContain('text-white')
    expect(current.classes()).not.toContain('bg-white')
    expect(wrapper.findAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('disables previous on the first page and next on the last page', () => {
    const first = mount(PaginationNav, { props: { page: 1, totalPages: 3 } })
    expect(first.findAll('button')[0]?.attributes('disabled')).toBeDefined()
    const last = mount(PaginationNav, { props: { page: 3, totalPages: 3 } })
    expect(last.findAll('button').at(-1)?.attributes('disabled')).toBeDefined()
  })

  it('emits the requested page', async () => {
    const wrapper = mount(PaginationNav, { props: { page: 2, totalPages: 5 } })
    await wrapper.get('button[aria-label="第 4 頁"]').trigger('click')
    await wrapper.findAll('button').at(-1)?.trigger('click')
    expect(wrapper.emitted('change')).toEqual([[4], [3]])
  })
})
