<script setup lang="ts">
import { ref } from 'vue'

import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const isRetrying = ref(false)

async function handleRetry() {
  isRetrying.value = true
  try {
    await authStore.retrySessionRestore()
  } finally {
    isRetrying.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-10">
    <h1 class="text-xl font-bold text-slate-900">
      無法確認登入狀態
    </h1>
    <p class="text-slate-600">
      目前無法連線到伺服器，你的登入資訊仍保留。請稍後再試。
    </p>
    <button
      type="button"
      :disabled="isRetrying"
      class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
      @click="handleRetry"
    >
      {{ isRetrying ? '重試中…' : '重試' }}
    </button>
  </main>
</template>
