<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import ProductGrid from '@/components/product/ProductGrid.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { useFeaturedProducts } from '@/composables/useFeaturedProducts'
import { describeCatalogFailure } from '@/lib/catalogFailure'
import { useProductCatalogStore } from '@/stores/productCatalogStore'

const catalogStore = useProductCatalogStore()
const { state, retry } = useFeaturedProducts()

onMounted(() => void catalogStore.loadCategories())
</script>

<template>
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6">
    <section class="flex flex-col items-start gap-4 rounded-xl bg-indigo-50 px-6 py-10">
      <h1 class="text-3xl font-bold text-slate-900">
        生活選物店
      </h1>
      <p class="max-w-prose text-slate-600">
        家居、文具、小物，挑選讓日常更舒適的好物。
      </p>
      <RouterLink
        :to="{ name: 'products' }"
        class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        瀏覽所有商品
      </RouterLink>
    </section>

    <section
      v-if="catalogStore.categories.length > 0"
      aria-labelledby="home-categories"
      class="flex flex-col gap-3"
    >
      <h2
        id="home-categories"
        class="text-xl font-semibold text-slate-900"
      >
        商品分類
      </h2>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="category in catalogStore.categories"
          :key="category.id"
        >
          <RouterLink
            :to="{ name: 'products', query: { category: category.id } }"
            class="inline-block rounded-full border border-slate-300 bg-white px-4 py-1 text-sm transition hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {{ category.name }}
          </RouterLink>
        </li>
      </ul>
    </section>

    <section
      aria-labelledby="home-newest"
      class="flex flex-col gap-4"
    >
      <h2
        id="home-newest"
        class="text-xl font-semibold text-slate-900"
      >
        最新商品
      </h2>
      <ErrorState
        v-if="state.status === 'error'"
        :message="describeCatalogFailure(state.failure)"
        @retry="retry"
      />
      <EmptyState
        v-else-if="state.status === 'success' && state.products.length === 0"
        title="目前沒有商品"
      />
      <ProductGrid
        v-else
        :products="state.status === 'success' ? state.products : []"
        :skeleton-count="8"
      />
    </section>
  </main>
</template>
