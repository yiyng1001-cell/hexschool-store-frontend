import { accessTokenStorage } from './accessTokenStorage'
import { createHttpClient } from './httpClient'

let unauthorizedListener: (() => void) | null = null

/** Registered once by the app shell so `api/` never imports `stores/` or `router/`. */
export function setUnauthorizedListener(listener: (() => void) | null): void {
  unauthorizedListener = listener
}

let slowRequestsListener: ((hasSlowRequests: boolean) => void) | null = null

/** Registered once by the app entry so `api/` never imports `stores/`. */
export function setSlowRequestsListener(listener: ((hasSlowRequests: boolean) => void) | null): void {
  slowRequestsListener = listener
}

function readApiBaseUrl(): string {
  const baseUrl: unknown = import.meta.env.VITE_API_BASE_URL
  if (typeof baseUrl !== 'string' || baseUrl === '') {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  return baseUrl.replace(/\/+$/, '')
}

export const apiClient = createHttpClient({
  baseUrl: readApiBaseUrl(),
  fetchImplementation: (...args) => fetch(...args),
  readAccessToken: () => accessTokenStorage.read(),
  onUnauthorized: () => unauthorizedListener?.(),
  onSlowRequestsChange: (hasSlowRequests) => slowRequestsListener?.(hasSlowRequests),
})
