import { watch } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'

/** Loads the cart once a user is logged in and drops it as soon as they are not (logout, expiry, account switch). */
export function useCartSync(): void {
  const authStore = useAuthStore()
  const cartStore = useCartStore()

  watch(
    () => authStore.status,
    (status) => {
      if (status === 'authenticated') void cartStore.loadCart()
      // `restoreFailed` keeps the token, so the cart is kept (or stays unloaded) until the session is confirmed.
      else if (status === 'anonymous') cartStore.reset()
    },
    { immediate: true },
  )
}
