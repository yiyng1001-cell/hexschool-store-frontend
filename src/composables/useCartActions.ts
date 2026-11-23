import { useRoute, useRouter } from 'vue-router'

import { describeCartFailure } from '@/lib/cartFailure'
import type { CartFailure, CartResult } from '@/lib/cartFailure'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import type { Cart } from '@/stores/cartStore'
import { useToastStore } from '@/stores/toastStore'

export function useCartActions() {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  const toastStore = useToastStore()
  const router = useRouter()
  const route = useRoute()

  function reportFailure(failure: CartFailure): void {
    const message = describeCartFailure(failure)
    // Empty messages are failures handled elsewhere: the global 401 handler, or a click already in flight.
    if (message !== '') toastStore.show('error', message)
  }

  async function runAndReport(
    run: () => Promise<CartResult<Cart>>,
    successMessage: string,
    action?: { label: string; routeName: string },
  ): Promise<void> {
    const result = await run()
    if (result.ok) toastStore.show('success', successMessage, action)
    else reportFailure(result.failure)
  }

  async function addToCart(productId: string): Promise<void> {
    // Public pages render before the stored session is verified, so a very early click must wait for it.
    await authStore.ensureSessionRestored()
    if (authStore.status === 'anonymous') {
      toastStore.show('info', '請先登入')
      await router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    if (authStore.status !== 'authenticated') {
      toastStore.show('error', '無法確認登入狀態，請稍後再試')
      return
    }
    await runAndReport(() => cartStore.addProduct(productId), '已加入購物車', {
      label: '前往購物車',
      routeName: 'cart',
    })
  }

  const changeQuantity = (productId: string, quantity: number) =>
    runAndReport(() => cartStore.setQuantity(productId, quantity), '已更新數量')

  const removeItem = (productId: string) =>
    runAndReport(() => cartStore.removeItem(productId), '已移除')

  return { addToCart, changeQuantity, removeItem }
}
