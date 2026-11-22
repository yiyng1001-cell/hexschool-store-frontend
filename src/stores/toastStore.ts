import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastAction {
  readonly label: string
  readonly routeName: string
}

export interface Toast {
  readonly id: number
  readonly kind: ToastKind
  readonly message: string
  readonly action?: ToastAction
}

const MAX_VISIBLE_TOASTS = 3

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<readonly Toast[]>([])
  let nextId = 1

  function show(kind: ToastKind, message: string, action?: ToastAction): number {
    const id = nextId
    nextId += 1
    const toast: Toast = { id, kind, message, ...(action ? { action } : {}) }
    toasts.value = [...toasts.value, toast].slice(-MAX_VISIBLE_TOASTS)
    return id
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return { toasts, show, dismiss }
})
