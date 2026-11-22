<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AddToCartButton from '@/components/cart/AddToCartButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import ProductImage from '@/components/ui/ProductImage.vue'
import { useProductDetail } from '@/composables/useProductDetail'
import { describeCatalogFailure } from '@/lib/catalogFailure'
import { formatPrice } from '@/lib/formatPrice'
import { useProductCatalogStore } from '@/stores/productCatalogStore'

const route = useRoute()
const catalogStore = useProductCatalogStore()
const productId = computed(() => String(route.params.id))
const { state, retry } = useProductDetail(productId)
// Keep the list filters the visitor came from, if any.
const backToListLocation = computed(() => ({ name: 'products', query: catalogStore.lastListRouteQuery }))
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
    <RouterLink
      :to="backToListLocation"
      class="self-start text-sm text-indigo-600 underline hover:text-indigo-800"
    >
      ← 回到商品列表
    </RouterLink>

    <div
      v-if="state.status === 'loading'"
      class="grid animate-pulse gap-6 md:grid-cols-2"
      aria-busy="true"
    >
      <div class="aspect-square rounded-lg bg-slate-200" />
      <div class="flex flex-col gap-3">
        <div class="h-6 w-2/3 rounded bg-slate-200" />
        <div class="h-5 w-1/3 rounded bg-slate-200" />
        <div class="h-24 rounded bg-slate-200" />
      </div>
    </div>

    <EmptyState
      v-else-if="state.status === 'error' && state.failure.kind === 'notFound'"
      title="商品不存在或已下架"
    >
      <RouterLink
        :to="{ name: 'products' }"
        class="text-indigo-600 underline hover:text-indigo-800"
      >前往商品列表</RouterLink>
    </EmptyState>
    <ErrorState
      v-else-if="state.status === 'error'"
      :message="describeCatalogFailure(state.failure)"
      @retry="retry"
    />

    <article
      v-else-if="state.status === 'success'"
      class="grid gap-6 md:grid-cols-2"
    >
      <div class="aspect-square overflow-hidden rounded-lg bg-slate-100">
        <ProductImage
          :src="state.product.imageUrl"
          :alt="state.product.name"
        />
      </div>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-slate-500">
          {{ state.product.category.name }}
        </p>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ state.product.name }}
        </h1>
        <p class="text-xl font-semibold text-slate-900">
          {{ formatPrice(state.product.price) }}
        </p>
        <p class="whitespace-pre-line text-slate-700">
          {{ state.product.description }}
        </p>
        <div class="max-w-xs">
          <AddToCartButton :product-id="state.product.id" />
        </div>
      </div>
    </article>
  </main>
</template>
