import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { cartApi } from '@/api/cartApi'
import type { Cart, CartItem } from '@/api/cartApi'
import { shouldReloadAfter } from '@/lib/cartFailure'
import type { CartFailure, CartResult } from '@/lib/cartFailure'
import { calculateQuantityAfterAdd } from '@/lib/cartRules'

import { toCartFailure } from './toCartFailure'
import type { CartOperation } from './toCartFailure'

export type CartState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly previous: Cart | null }
  | { readonly status: 'ready'; readonly cart: Cart }
  | { readonly status: 'error'; readonly previous: Cart | null }

export type { Cart, CartItem }

export const useCartStore = defineStore('cart', () => {
  const state = ref<CartState>({ status: 'idle' })
  const pendingProductIds = ref<readonly string[]>([])

  // Bumped by reset(): responses that belong to a previous session must not overwrite the new one.
  let generation = 0
  // All backend calls run one after another so an older response can never overwrite a newer one.
  let queueTail: Promise<unknown> = Promise.resolve()

  const cart = computed<Cart | null>(() => {
    const current = state.value
    if (current.status === 'ready') return current.cart
    return current.status === 'idle' ? null : current.previous
  })
  const totalQuantity = computed(() => cart.value?.totalQuantity ?? 0)

  function quantityOf(productId: string): number | null {
    return cart.value?.items.find((item) => item.product.id === productId)?.quantity ?? null
  }

  function enqueue<TValue>(task: () => Promise<TValue>): Promise<TValue> {
    const run = queueTail.then(task, task)
    queueTail = run.catch(() => undefined)
    return run
  }

  function markPending(productId: string, isPending: boolean): void {
    pendingProductIds.value = isPending
      ? [...pendingProductIds.value, productId]
      : pendingProductIds.value.filter((id) => id !== productId)
  }

  /** Queues a task for the current session; if the session changed before it runs, it is skipped. */
  function enqueueInSession<TValue>(
    task: (startedIn: number) => Promise<TValue>,
    valueWhenSessionChanged: TValue,
  ): Promise<TValue> {
    const startedIn = generation
    return enqueue(() =>
      startedIn === generation ? task(startedIn) : Promise.resolve(valueWhenSessionChanged),
    )
  }

  async function fetchCartNow(startedIn: number): Promise<void> {
    state.value = { status: 'loading', previous: cart.value }
    try {
      const fetched = await cartApi.getCart()
      if (startedIn === generation) state.value = { status: 'ready', cart: fetched }
    } catch (error) {
      toCartFailure(error, 'load') // rethrows programming errors; API failures are shown as the error state
      if (startedIn === generation) state.value = { status: 'error', previous: cart.value }
    }
  }

  const loadCart = (): Promise<void> => enqueueInSession(fetchCartNow, undefined)

  function reset(): void {
    generation += 1
    state.value = { status: 'idle' }
    pendingProductIds.value = []
  }

  async function sendMutation(
    request: () => Promise<Cart>,
    operation: CartOperation,
    startedIn: number,
  ): Promise<CartResult<Cart>> {
    try {
      const updated = await request()
      if (startedIn !== generation) return { ok: false, failure: { kind: 'unauthorized' } }
      state.value = { status: 'ready', cart: updated }
      return { ok: true, value: updated }
    } catch (error) {
      const failure = toCartFailure(error, operation)
      if (startedIn === generation && shouldReloadAfter(failure)) await fetchCartNow(startedIn)
      return { ok: false, failure }
    }
  }

  function runForProduct(
    productId: string,
    task: (startedIn: number) => Promise<CartResult<Cart>>,
  ): Promise<CartResult<Cart>> {
    if (pendingProductIds.value.includes(productId)) {
      return Promise.resolve<CartResult<Cart>>({ ok: false, failure: { kind: 'busy' } })
    }
    markPending(productId, true)
    return enqueueInSession(task, failed({ kind: 'unauthorized' })).finally(() =>
      markPending(productId, false),
    )
  }

  function setQuantity(productId: string, quantity: number): Promise<CartResult<Cart>> {
    return runForProduct(productId, (startedIn) =>
      sendMutation(() => cartApi.setCartItemQuantity(productId, quantity), 'setQuantity', startedIn),
    )
  }

  function removeItem(productId: string): Promise<CartResult<Cart>> {
    return runForProduct(productId, (startedIn) =>
      sendMutation(() => cartApi.removeCartItem(productId), 'remove', startedIn),
    )
  }

  /** "Add" is a PUT of current + 1, so it needs an up-to-date cart: otherwise it would overwrite the stored quantity. */
  function addProduct(productId: string): Promise<CartResult<Cart>> {
    return runForProduct(productId, async (startedIn) => {
      if (state.value.status !== 'ready') await fetchCartNow(startedIn)
      if (state.value.status !== 'ready') return failed({ kind: 'cartNotLoaded' })

      const nextQuantity = calculateQuantityAfterAdd(quantityOf(productId))
      if (nextQuantity === null) return failed({ kind: 'quantityLimit' })
      return sendMutation(
        () => cartApi.setCartItemQuantity(productId, nextQuantity),
        'setQuantity',
        startedIn,
      )
    })
  }

  return {
    state,
    cart,
    totalQuantity,
    pendingProductIds,
    quantityOf,
    loadCart,
    reset,
    addProduct,
    setQuantity,
    removeItem,
  }
})

function failed(failure: CartFailure): CartResult<Cart> {
  return { ok: false, failure }
}
