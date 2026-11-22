<script setup lang="ts">
import type { Product } from '@/stores/productCatalogStore'

import ProductCard from './ProductCard.vue'
import ProductCardSkeleton from './ProductCardSkeleton.vue'

defineProps<{ products: readonly Product[]; isLoading?: boolean; skeletonCount?: number }>()
</script>

<template>
  <ul
    class="grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
    :class="{ 'opacity-60': isLoading && products.length > 0 }"
    :aria-busy="isLoading ? 'true' : undefined"
  >
    <template v-if="products.length === 0">
      <li
        v-for="index in skeletonCount ?? 12"
        :key="index"
      >
        <ProductCardSkeleton />
      </li>
    </template>
    <li
      v-for="product in products"
      v-else
      :key="product.id"
    >
      <ProductCard :product="product" />
    </li>
  </ul>
</template>
