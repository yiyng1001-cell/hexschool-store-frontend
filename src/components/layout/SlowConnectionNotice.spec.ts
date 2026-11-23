import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useConnectionStore } from '@/stores/connectionStore'

import SlowConnectionNotice from './SlowConnectionNotice.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('SlowConnectionNotice', () => {
  it('keeps an empty live region while the backend answers quickly', () => {
    const wrapper = mount(SlowConnectionNotice, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('[aria-live="polite"]').text()).toBe('')
  })

  it('announces that the server is waking up once requests are slow', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(SlowConnectionNotice, { global: { plugins: [pinia] } })

    useConnectionStore().setBackendSlow(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[aria-live="polite"]').text()).toContain('伺服器正在喚醒中')
  })
})
