import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { ApiHttpError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthUser } from '@/api/authApi'
import { mountWithApp } from '@/testing/mountWithApp'

vi.mock('@/api/authApi', () => ({
  authApi: { registerUser: vi.fn(), loginUser: vi.fn(), getCurrentUser: vi.fn() },
}))

const user: AuthUser = {
  id: 'u1',
  email: 'new@example.com',
  name: '小華',
  role: 'USER',
  createdAt: '2026-11-21T10:00:00.000Z',
}

beforeEach(() => {
  window.localStorage.clear()
})

async function fill(wrapper: Awaited<ReturnType<typeof mountWithApp>>['wrapper']) {
  await wrapper.get('#register-name').setValue(' 小華 ')
  await wrapper.get('#register-email').setValue('new@example.com')
  await wrapper.get('#register-password').setValue('Passw0rdOk')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('RegisterView', () => {
  it('registers with only contract fields and ends up logged in', async () => {
    vi.mocked(authApi.registerUser).mockResolvedValue({ user, accessToken: 'token-1' })
    const { wrapper, router } = await mountWithApp(App, '/register')

    await fill(wrapper)

    expect(authApi.registerUser).toHaveBeenCalledWith({
      name: '小華',
      email: 'new@example.com',
      password: 'Passw0rdOk',
    })
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).toContain('小華')
  })

  it('shows a duplicated email on the email field', async () => {
    vi.mocked(authApi.registerUser).mockRejectedValue(
      new ApiHttpError({ status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'x' }),
    )
    const { wrapper } = await mountWithApp(App, '/register')

    await fill(wrapper)

    expect(wrapper.get('#register-email-error').text()).toBe('此 email 已被註冊')
  })

  it('maps backend validation details onto their fields', async () => {
    vi.mocked(authApi.registerUser).mockRejectedValue(
      new ApiHttpError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'x',
        details: [{ field: 'password', message: '後端：密碼太弱' }],
      }),
    )
    const { wrapper } = await mountWithApp(App, '/register')

    await fill(wrapper)

    expect(wrapper.get('#register-password-error').text()).toBe('後端：密碼太弱')
  })

  it('blocks a weak password before calling the backend', async () => {
    const { wrapper } = await mountWithApp(App, '/register')
    await wrapper.get('#register-name').setValue('小華')
    await wrapper.get('#register-email').setValue('new@example.com')
    await wrapper.get('#register-password').setValue('short')
    await wrapper.get('form').trigger('submit')

    expect(authApi.registerUser).not.toHaveBeenCalled()
    expect(wrapper.find('#register-password-error').exists()).toBe(true)
  })
})
