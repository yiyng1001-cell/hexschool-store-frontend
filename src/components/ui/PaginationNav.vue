<script setup lang="ts">
import { computed } from 'vue'

import { buildPaginationItems } from '@/lib/buildPaginationItems'

const props = defineProps<{ page: number; totalPages: number; disabled?: boolean }>()
const emit = defineEmits<{ change: [page: number] }>()

const items = computed(() => buildPaginationItems(props.page, props.totalPages))
const baseClass =
  'min-w-10 rounded-md border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50'
const idleClass = `${baseClass} border-slate-300 bg-white hover:bg-slate-100`
// Must not share a background utility with idleClass: two competing bg-* classes make the winner depend on CSS order.
const currentClass = `${baseClass} border-indigo-600 bg-indigo-600 text-white`
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="分頁"
    class="flex flex-wrap items-center justify-center gap-2"
  >
    <button
      type="button"
      :class="idleClass"
      :disabled="disabled || page <= 1"
      @click="emit('change', page - 1)"
    >
      上一頁
    </button>
    <template
      v-for="item in items"
      :key="item.kind === 'page' ? item.page : item.key"
    >
      <span
        v-if="item.kind === 'ellipsis'"
        class="px-1 text-slate-500"
        aria-hidden="true"
      >…</span>
      <button
        v-else
        type="button"
        :class="item.page === page ? currentClass : idleClass"
        :aria-current="item.page === page ? 'page' : undefined"
        :disabled="disabled"
        :aria-label="`第 ${item.page} 頁`"
        @click="emit('change', item.page)"
      >
        {{ item.page }}
      </button>
    </template>
    <button
      type="button"
      :class="idleClass"
      :disabled="disabled || page >= totalPages"
      @click="emit('change', page + 1)"
    >
      下一頁
    </button>
  </nav>
</template>
