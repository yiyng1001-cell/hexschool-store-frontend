import type { Router } from 'vue-router'

import { setUnauthorizedListener } from '@/api/apiClient'
import { useAuthStore } from '@/stores/authStore'

/** An expired or invalid token clears the session and sends the user to log in, returning afterwards. */
export function redirectToLoginOnSessionExpiry(router: Router): void {
  setUnauthorizedListener(() => {
    useAuthStore().clearSession()
    const current = router.currentRoute.value
    void router.replace({ name: 'login', query: { redirect: current.fullPath } })
  })
}
