import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useToastStore } from './toastStore'

beforeEach(() => setActivePinia(createPinia()))

describe('toastStore', () => {
  it('shows and dismisses toasts', () => {
    const store = useToastStore()
    const id = store.show('success', '已加入購物車', { label: '前往購物車', routeName: 'cart' })
    expect(store.toasts).toEqual([{ id, kind: 'success', message: '已加入購物車', action: { label: '前往購物車', routeName: 'cart' } }])
    store.dismiss(id)
    expect(store.toasts).toEqual([])
  })

  it('keeps only the most recent toasts', () => {
    const store = useToastStore()
    ;['a', 'b', 'c', 'd'].forEach((message) => store.show('info', message))
    expect(store.toasts.map((toast) => toast.message)).toEqual(['b', 'c', 'd'])
  })

  it('gives every toast a unique id', () => {
    const store = useToastStore()
    expect(store.show('info', 'a')).not.toBe(store.show('info', 'a'))
  })
})
