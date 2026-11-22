<script setup lang="ts">
import { ref, watch } from 'vue'

import { useDebouncedCallback } from '@/composables/useDebouncedCallback'
import { SEARCH_KEYWORD_MAX_LENGTH } from '@/lib/productListQuery'

const SEARCH_DEBOUNCE_MILLISECONDS = 300

const props = defineProps<{ keyword: string | null }>()
const emit = defineEmits<{ search: [keyword: string | null] }>()

const draft = ref(props.keyword ?? '')
const emitSearch = useDebouncedCallback((value: string) => {
  const trimmed = value.trim()
  if ((trimmed || null) !== props.keyword) emit('search', trimmed || null)
}, SEARCH_DEBOUNCE_MILLISECONDS)

watch(
  () => props.keyword,
  (keyword) => {
    draft.value = keyword ?? ''
  },
)
</script>

<template>
  <form
    role="search"
    class="flex gap-2"
    @submit.prevent="emitSearch.runNow(draft)"
  >
    <label
      for="product-search"
      class="sr-only"
    >搜尋商品</label>
    <input
      id="product-search"
      v-model="draft"
      type="search"
      :maxlength="SEARCH_KEYWORD_MAX_LENGTH"
      placeholder="搜尋商品名稱或描述"
      autocomplete="off"
      class="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 transition hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      @input="emitSearch.schedule(draft)"
    >
    <button
      type="submit"
      class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      搜尋
    </button>
  </form>
</template>
