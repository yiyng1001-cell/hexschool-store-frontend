<script setup lang="ts">
import { ref } from 'vue'

import type { ProductFilterChange } from '@/composables/useProductList'
import { PRODUCT_SORTS } from '@/lib/productListQuery'
import type { ProductListQuery, ProductSort } from '@/lib/productListQuery'
import type { CategoriesState, Category } from '@/stores/productCatalogStore'

import ProductSearchInput from './ProductSearchInput.vue'

defineProps<{
  query: ProductListQuery
  categories: readonly Category[]
  categoriesState: CategoriesState
}>()
const emit = defineEmits<{ change: [change: ProductFilterChange]; retryCategories: [] }>()

const isOpenOnMobile = ref(false)
const SORT_LABELS: Record<ProductSort, string> = {
  newest: '最新上架',
  price_asc: '價格由低到高',
  price_desc: '價格由高到低',
}
const selectClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 transition hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200'

function readSort(event: Event): ProductSort | null {
  const value = (event.target as HTMLSelectElement).value
  return PRODUCT_SORTS.find((sort) => sort === value) ?? null
}
</script>

<template>
  <section
    aria-label="篩選與搜尋"
    class="flex flex-col gap-3"
  >
    <ProductSearchInput
      :keyword="query.q"
      @search="emit('change', { q: $event })"
    />

    <button
      type="button"
      class="min-h-10 self-start rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:hidden"
      :aria-expanded="isOpenOnMobile"
      aria-controls="product-filters"
      @click="isOpenOnMobile = !isOpenOnMobile"
    >
      分類與排序
    </button>

    <div
      id="product-filters"
      class="grid-cols-1 gap-3 md:grid md:grid-cols-2"
      :class="isOpenOnMobile ? 'grid' : 'hidden'"
    >
      <div class="flex flex-col gap-1">
        <label
          for="product-category"
          class="text-sm font-medium text-slate-700"
        >分類</label>
        <select
          id="product-category"
          :class="selectClass"
          :value="query.category ?? ''"
          :disabled="categoriesState === 'loading'"
          :aria-busy="categoriesState === 'loading' ? 'true' : undefined"
          @change="emit('change', { category: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">
            {{ categoriesState === 'loading' ? '分類載入中…' : '全部分類' }}
          </option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <button
          v-if="categoriesState === 'error'"
          type="button"
          class="self-start py-1 text-sm text-red-600 underline"
          @click="emit('retryCategories')"
        >
          分類載入失敗，重試
        </button>
      </div>
      <div class="flex flex-col gap-1">
        <label
          for="product-sort"
          class="text-sm font-medium text-slate-700"
        >排序</label>
        <select
          id="product-sort"
          :class="selectClass"
          :value="query.sort"
          @change="(event) => { const sort = readSort(event); if (sort) emit('change', { sort }) }"
        >
          <option
            v-for="sort in PRODUCT_SORTS"
            :key="sort"
            :value="sort"
          >
            {{ SORT_LABELS[sort] }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>
