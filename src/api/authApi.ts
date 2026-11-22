import { apiClient } from './apiClient'
import type { HttpClient } from './httpClient'
import type { components } from './types'

export type AuthUser = components['schemas']['User']
export type AuthSession = components['schemas']['AuthData']
export type RegisterInput = components['schemas']['RegisterRequest']
export type LoginInput = components['schemas']['LoginRequest']

export interface AuthApi {
  registerUser(input: RegisterInput): Promise<AuthSession>
  loginUser(input: LoginInput): Promise<AuthSession>
  getCurrentUser(signal?: AbortSignal): Promise<AuthUser>
}

export function createAuthApi(client: HttpClient): AuthApi {
  return {
    registerUser(input) {
      return client.request<AuthSession>('POST', '/api/auth/register', {
        body: input,
        requiresAuth: false,
        handleUnauthorized: false,
      })
    },
    loginUser(input) {
      return client.request<AuthSession>('POST', '/api/auth/login', {
        body: input,
        requiresAuth: false,
        handleUnauthorized: false,
      })
    },
    async getCurrentUser(signal) {
      const data = await client.request<{ user: AuthUser }>('GET', '/api/auth/me', {
        signal,
        handleUnauthorized: false,
      })
      return data.user
    },
  }
}

export const authApi = createAuthApi(apiClient)
