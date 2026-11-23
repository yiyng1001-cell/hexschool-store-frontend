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
  if (to.meta.requiresAuth !== true && to.meta.guestOnly !== true) {
    // Public pages must not wait for `/me`: a sleeping backend would otherwise block the whole site.
    void authStore.ensureSessionRestored().catch((error: unknown) => {
      console.warn('auth.session_restore_failed', { error })
    })
    return true
  }
  await authStore.ensureSessionRestored()

  if (to.meta.guestOnly && authStore.isAuthenticated) return { name: 'home' }
  if (to.meta.requiresAuth && authStore.status === 'anonymous') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // `restoreFailed` is allowed through: the app shell shows a retry screen instead of logging the user out.
  return true
}
