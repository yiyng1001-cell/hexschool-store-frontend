import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

export async function authNavigationGuard(
  to: RouteLocationNormalized,
): Promise<true | RouteLocationRaw> {
  const authStore = useAuthStore()
  await authStore.ensureSessionRestored()

  if (to.meta.guestOnly && authStore.isAuthenticated) return { name: 'home' }
  if (to.meta.requiresAuth && authStore.status === 'anonymous') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // `restoreFailed` is allowed through: the app shell shows a retry screen instead of logging the user out.
  return true
}
