<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()
const isMenuOpen = ref(false)
const isRetrying = ref(false)

const linkClass =
  'rounded px-2 py-1 text-slate-700 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'

async function handleLogout() {
  authStore.logout()
  isMenuOpen.value = false
  await router.replace({ name: 'home' })
}

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
  <header class="border-b border-slate-200 bg-white">
    <nav
      aria-label="主要導覽"
      class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3"
    >
      <RouterLink
        :to="{ name: 'home' }"
        class="text-lg font-bold text-slate-900"
      >生活選物店</RouterLink>

      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:hidden"
        :aria-expanded="isMenuOpen"
        aria-controls="primary-menu"
        @click="isMenuOpen = !isMenuOpen"
      >
        選單
      </button>

      <ul
        id="primary-menu"
        class="w-full flex-col items-start gap-2 md:flex md:w-auto md:flex-row md:items-center md:gap-4"
        :class="isMenuOpen ? 'flex' : 'hidden'"
      >
        <li v-if="authStore.status === 'anonymous'">
          <RouterLink
            :to="{ name: 'login' }"
            :class="linkClass"
          >登入</RouterLink>
        </li>
        <li v-if="authStore.status === 'anonymous'">
          <RouterLink
            :to="{ name: 'register' }"
            :class="linkClass"
          >註冊</RouterLink>
        </li>
        <li
          v-if="authStore.currentUser"
          class="text-slate-900"
        >
          {{ authStore.currentUser.name }}
        </li>
        <li v-if="authStore.isAuthenticated">
          <button
            type="button"
            :class="linkClass"
            @click="handleLogout"
          >
            登出
          </button>
        </li>
        <li v-if="authStore.status === 'restoreFailed'">
          <button
            type="button"
            :class="linkClass"
            :disabled="isRetrying"
            @click="handleRetry"
          >
            {{ isRetrying ? '重試中…' : '無法確認登入狀態，重試' }}
          </button>
        </li>
      </ul>
    </nav>
  </header>
</template>
