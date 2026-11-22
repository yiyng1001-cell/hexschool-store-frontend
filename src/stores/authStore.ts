import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { accessTokenStorage } from '@/api/accessTokenStorage'
import { ApiHttpError, ApiNetworkError } from '@/api/apiError'
import { authApi } from '@/api/authApi'
import type { AuthSession, AuthUser, LoginInput, RegisterInput } from '@/api/authApi'
import type { AuthResult } from '@/lib/authFailure'

import { toAuthFailure } from './toAuthFailure'

export type AuthState =
  | { readonly status: 'unknown' }
  | { readonly status: 'anonymous' }
  | { readonly status: 'restoreFailed' }
  | { readonly status: 'authenticated'; readonly user: AuthUser }

function isUnreachableBackendError(error: unknown): boolean {
  return error instanceof ApiNetworkError || (error instanceof ApiHttpError && error.status >= 500)
}

export const useAuthStore = defineStore('auth', () => {
  const state = ref<AuthState>({ status: 'unknown' })
  const status = computed(() => state.value.status)
  const currentUser = computed(() =>
    state.value.status === 'authenticated' ? state.value.user : null,
  )
  const isAuthenticated = computed(() => state.value.status === 'authenticated')

  let pendingRestore: Promise<void> | null = null

  function startSession(session: AuthSession): void {
    accessTokenStorage.write(session.accessToken)
    state.value = { status: 'authenticated', user: session.user }
  }

  function clearSession(): void {
    accessTokenStorage.clear()
    state.value = { status: 'anonymous' }
  }

  async function restoreFromStoredToken(): Promise<void> {
    if (accessTokenStorage.read() === null) {
      state.value = { status: 'anonymous' }
      return
    }
    try {
      state.value = { status: 'authenticated', user: await authApi.getCurrentUser() }
    } catch (error) {
      if (isUnreachableBackendError(error)) {
        state.value = { status: 'restoreFailed' }
      } else if (error instanceof ApiHttpError && error.code === 'UNAUTHORIZED') {
        clearSession()
      } else {
        throw error
      }
    }
  }

  function runSessionRestore(): Promise<void> {
    pendingRestore ??= restoreFromStoredToken().finally(() => {
      pendingRestore = null
    })
    return pendingRestore
  }

  /** Restores the session once; concurrent callers share the same attempt. */
  function ensureSessionRestored(): Promise<void> {
    return state.value.status === 'unknown' ? runSessionRestore() : Promise.resolve()
  }

  function retrySessionRestore(): Promise<void> {
    return state.value.status === 'restoreFailed' ? runSessionRestore() : Promise.resolve()
  }

  async function authenticate(request: () => Promise<AuthSession>): Promise<AuthResult> {
    try {
      startSession(await request())
      return { ok: true }
    } catch (error) {
      return { ok: false, failure: toAuthFailure(error) }
    }
  }

  const registerUser = (input: RegisterInput) => authenticate(() => authApi.registerUser(input))
  const loginUser = (input: LoginInput) => authenticate(() => authApi.loginUser(input))

  return {
    status,
    currentUser,
    isAuthenticated,
    ensureSessionRestored,
    retrySessionRestore,
    registerUser,
    loginUser,
    logout: clearSession,
    clearSession,
  }
})
