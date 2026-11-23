<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import ProductFilterBar from '@/components/product/ProductFilterBar.vue'
import ProductGrid from '@/components/product/ProductGrid.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import PaginationNav from '@/components/ui/PaginationNav.vue'
import { useProductList } from '@/composables/useProductList'
import { describeCatalogFailure } from '@/lib/catalogFailure'
import { PRODUCT_PAGE_SIZE } from '@/lib/productListQuery'
import { useProductCatalogStore } from '@/stores/productCatalogStore'

const catalogStore = useProductCatalogStore()
const { state, query, hasActiveFilters, applyFilters, goToPage, clearFilters, retry } = useProductList()
const headingElement = ref<HTMLHeadingElement | null>(null)

onMounted(() => void catalogStore.loadCategories())

const visibleProducts = computed(() => {
  const current = state.value
  if (current.status === 'success') return current.data.items
  return current.status === 'loading' ? (current.previous?.items ?? []) : []
})
const meta = computed(() => {
  const current = state.value
  if (current.status === 'success') return current.data.meta
  return current.status === 'loading' ? (current.previous?.meta ?? null) : null
})

// Only a pagination click moves focus to the heading. A filter or search also resets the page, and stealing focus then would interrupt typing.
let shouldFocusHeadingAfterPageChange = false

function changePage(page: number): void {
  shouldFocusHeadingAfterPageChange = true
  goToPage(page)
}

watch(
  () => query.value.page,
  async () => {
    window.scrollTo({ top: 0 })
    if (!shouldFocusHeadingAfterPageChange) return
    shouldFocusHeadingAfterPageChange = false
    await nextTick()
    headingElement.value?.focus()
  },
)
</script>

<template>
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
    <h1
      ref="headingElement"
      tabindex="-1"
      class="text-2xl font-bold text-slate-900 focus:outline-none"
    >
      商品列表
    </h1>

    <ProductFilterBar
      :query="query"
      :categories="catalogStore.categories"
      :categories-state="catalogStore.categoriesState"
      @change="applyFilters"
      @retry-categories="catalogStore.loadCategories"
    />

    <section
      aria-label="商品"
      class="flex flex-col gap-6"
      aria-live="polite"
    >
      <ErrorState
        v-if="state.status === 'error'"
        :message="describeCatalogFailure(state.failure)"
        @retry="retry"
      />
      <EmptyState
        v-else-if="state.status === 'empty'"
        title="找不到符合條件的商品"
        :description="hasActiveFilters ? '試試調整分類或關鍵字。' : '目前沒有商品。'"
      >
        <button
          v-if="hasActiveFilters"
          type="button"
          class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          @click="clearFilters"
        >
          清除條件
        </button>
      </EmptyState>
      <template v-else>
        <ProductGrid
          :products="visibleProducts"
          :is-loading="state.status === 'loading'"
          :skeleton-count="PRODUCT_PAGE_SIZE"
        />
        <PaginationNav
          v-if="meta"
          :page="meta.page"
          :total-pages="meta.totalPages"
          :disabled="state.status === 'loading'"
          @change="changePage"
        />
      </template>
    </section>
  </main>
</template>
