import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiHttpError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { mountWithApp } from '@/testing/mountWithApp'
import App from '@/App.vue'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

const user: AuthUser = {
  id: 'u1',
  email: 'user@example.com',
  name: '小明',
  role: 'USER',
  createdAt: '2026-11-21T10:00:00.000Z',
}

beforeEach(() => {
  window.localStorage.clear()
})

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountWithApp>>['wrapper'], password = 'Passw0rdOk') {
  await wrapper.get('#login-email').setValue(' user@example.com ')
  await wrapper.get('#login-password').setValue(password)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  it('logs in, trims the email and goes to the safe redirect target', async () => {
    vi.mocked(authApi.loginUser).mockResolvedValue({ user, accessToken: 'token-1' })
    const { wrapper, router } = await mountWithApp(App, '/login?redirect=/products')
    router.addRoute({ path: '/products', component: { template: '<div />' } })

    await fillAndSubmit(wrapper)

    expect(authApi.loginUser).toHaveBeenCalledWith({ email: 'user@example.com', password: 'Passw0rdOk' })
    expect(router.currentRoute.value.fullPath).toBe('/products')
    expect(wrapper.text()).toContain('小明')
  })

  it('ignores an external redirect target', async () => {
    vi.mocked(authApi.loginUser).mockResolvedValue({ user, accessToken: 'token-1' })
    const { wrapper, router } = await mountWithApp(App, '/login?redirect=https://evil.com')

    await fillAndSubmit(wrapper)

    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('stays on the page and shows a form error for wrong credentials', async () => {
    vi.mocked(authApi.loginUser).mockRejectedValue(
      new ApiHttpError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }),
    )
    const { wrapper, router } = await mountWithApp(App, '/login')

    await fillAndSubmit(wrapper)

    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.get('[role="alert"]').text()).toBe('email 或密碼錯誤')
  })

  it('validates before calling the backend', async () => {
    const { wrapper } = await mountWithApp(App, '/login')

    await fillAndSubmit(wrapper, '')

    expect(authApi.loginUser).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('請輸入密碼')
  })

  it('disables the submit button while the request is in flight', async () => {
    let resolveLogin: (value: { user: AuthUser; accessToken: string }) => void = () => undefined
    vi.mocked(authApi.loginUser).mockReturnValue(new Promise((resolve) => (resolveLogin = resolve)))
    const { wrapper } = await mountWithApp(App, '/login')

    await wrapper.get('#login-email').setValue('user@example.com')
    await wrapper.get('#login-password').setValue('Passw0rdOk')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(authApi.loginUser).toHaveBeenCalledTimes(1)

    resolveLogin({ user, accessToken: 'token-1' })
    await flushPromises()
  })

  it('keeps the redirect when linking to the register page', async () => {
    const { wrapper } = await mountWithApp(App, '/login?redirect=/cart')
    const link = wrapper.findAll('a').find((anchor) => anchor.text() === '註冊' && anchor.attributes('href')?.includes('redirect'))
    expect(link?.attributes('href')).toBe('/register?redirect=/cart')
  })
})
