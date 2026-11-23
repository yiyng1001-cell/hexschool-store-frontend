import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useToastStore } from '@/stores/toastStore'

import ToastHost from './ToastHost.vue'

function mountHost() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<p />' } }] })
  const wrapper = mount(ToastHost, { global: { plugins: [pinia, router] } })
  return { wrapper, store: useToastStore() }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastHost', () => {
  it('dismisses a toast after four seconds', async () => {
    const { wrapper, store } = mountHost()
    store.show('success', '已加入購物車')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('已加入購物車')

    await vi.advanceTimersByTimeAsync(4_000)

    expect(wrapper.text()).not.toContain('已加入購物車')
  })

  it('keeps a toast while it is hovered and restarts the countdown afterwards', async () => {
    const { wrapper, store } = mountHost()
    store.show('success', '已加入購物車')
    await wrapper.vm.$nextTick()
    const toast = wrapper.get('[role="status"]')

    await toast.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(wrapper.text()).toContain('已加入購物車')

    await toast.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(4_000)
    expect(wrapper.text()).not.toContain('已加入購物車')
  })

  it('keeps a toast while one of its controls has keyboard focus', async () => {
    const { wrapper, store } = mountHost()
    store.show('info', '請先登入')
    await wrapper.vm.$nextTick()
    const toast = wrapper.get('[role="status"]')

    await toast.trigger('focusin')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(wrapper.text()).toContain('請先登入')

    await toast.trigger('focusout')
    await vi.advanceTimersByTimeAsync(4_000)
    expect(wrapper.text()).not.toContain('請先登入')
  })
})
