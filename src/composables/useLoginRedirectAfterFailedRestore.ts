import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'

/**
 * A retry of the session restore can end with the stored token rejected. The route guard has already run,
 * so a protected page would stay on screen without a session: send the visitor to log in instead.
 */
export function useLoginRedirectAfterFailedRestore(): void {
  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  watch(
    () => authStore.status,
    (status, previousStatus) => {
      if (previousStatus !== 'restoreFailed' || status !== 'anonymous') return
      if (route.meta.requiresAuth !== true) return
      void router.replace({ name: 'login', query: { redirect: route.fullPath } })
    },
  )
}
