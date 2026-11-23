<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppNavbar from '@/components/layout/AppNavbar.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import SessionRestoreFailed from '@/components/layout/SessionRestoreFailed.vue'
import SlowConnectionNotice from '@/components/layout/SlowConnectionNotice.vue'
import { useCartSync } from '@/composables/useCartSync'
import { useLoginRedirectAfterFailedRestore } from '@/composables/useLoginRedirectAfterFailedRestore'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
useCartSync()
useLoginRedirectAfterFailedRestore()
const route = useRoute()

const mustShowRestoreFailure = computed(
  () => authStore.status === 'restoreFailed' && route.meta.requiresAuth === true,
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <AppNavbar />
    <SlowConnectionNotice />
    <SessionRestoreFailed v-if="mustShowRestoreFailure" />
    <RouterView v-else />
    <ToastHost />
  </div>
</template>
