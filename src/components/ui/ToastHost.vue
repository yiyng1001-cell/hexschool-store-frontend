<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { useToastStore } from '@/stores/toastStore'

const TOAST_LIFETIME_MILLISECONDS = 4000

const toastStore = useToastStore()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function startDismissTimer(toastId: number): void {
  if (timers.has(toastId)) return
  timers.set(
    toastId,
    setTimeout(() => {
      timers.delete(toastId)
      toastStore.dismiss(toastId)
    }, TOAST_LIFETIME_MILLISECONDS),
  )
}

// Hovering or focusing a toast pauses its timer, so a keyboard or pointer user is not racing it.
function pauseDismissTimer(toastId: number): void {
  clearTimeout(timers.get(toastId))
  timers.delete(toastId)
}

watch(
  () => toastStore.toasts,
  (toasts) => toasts.forEach((toast) => startDismissTimer(toast.id)),
  { immediate: true },
)

onBeforeUnmount(() => timers.forEach((timer) => clearTimeout(timer)))

const kindClass = {
  success: 'border-green-300 bg-green-50 text-green-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-slate-300 bg-white text-slate-900',
} as const
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
    <div
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-lg"
      :class="kindClass[toast.kind]"
      :role="toast.kind === 'error' ? 'alert' : 'status'"
      @mouseenter="pauseDismissTimer(toast.id)"
      @mouseleave="startDismissTimer(toast.id)"
      @focusin="pauseDismissTimer(toast.id)"
      @focusout="startDismissTimer(toast.id)"
    >
      <span class="flex-1">{{ toast.message }}</span>
      <RouterLink
        v-if="toast.action"
        :to="{ name: toast.action.routeName }"
        class="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        {{ toast.action.label }}
      </RouterLink>
      <button
        type="button"
        class="rounded px-1 text-lg leading-none opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        aria-label="關閉通知"
        @click="toastStore.dismiss(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
