<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppNavbar from '@/components/layout/AppNavbar.vue'
import SessionRestoreFailed from '@/components/layout/SessionRestoreFailed.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()

const mustShowRestoreFailure = computed(
  () => authStore.status === 'restoreFailed' && route.meta.requiresAuth === true,
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <AppNavbar />
    <SessionRestoreFailed v-if="mustShowRestoreFailure" />
    <RouterView v-else />
  </div>
</template>
