<script setup lang="ts">
import { useConnectionStore } from '@/stores/connectionStore'

const connectionStore = useConnectionStore()
</script>

<template>
  <!-- The live region stays mounted so assistive technology announces the text when it appears. -->
  <div
    aria-live="polite"
    class="bg-amber-50 text-sm text-amber-900"
  >
    <p
      v-if="connectionStore.isBackendSlow"
      class="mx-auto max-w-6xl px-4 py-2"
    >
      伺服器正在喚醒中，第一次載入可能需要約一分鐘，請稍候…
    </p>
  </div>
</template>
