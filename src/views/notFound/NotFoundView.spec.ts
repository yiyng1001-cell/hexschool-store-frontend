import { describe, expect, it } from 'vitest'

import App from '@/App.vue'
import { mountWithApp } from '@/testing/mountWithApp'

describe('NotFoundView', () => {
  it('renders for an unknown path with links back to the site and a page title', async () => {
    const { wrapper } = await mountWithApp(App, '/no/such/page')

    expect(wrapper.get('h1').text()).toBe('找不到這個頁面')
    expect(wrapper.text()).toContain('404')
    const hrefs = wrapper.findAll('main a').map((link) => link.attributes('href'))
    expect(hrefs).toEqual(['/', '/products'])
    expect(document.title).toBe('找不到頁面 | 生活選物店')
  })
})
