<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AddToCartButton from '@/components/cart/AddToCartButton.vue'
import ProductImage from '@/components/ui/ProductImage.vue'
import { formatPrice } from '@/lib/formatPrice'
import type { Product } from '@/stores/productCatalogStore'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md">
    <RouterLink
      :to="{ name: 'productDetail', params: { id: product.id } }"
      class="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <div class="aspect-square overflow-hidden bg-slate-100">
        <ProductImage
          :src="product.imageUrl"
          :alt="product.name"
        />
      </div>
      <div class="flex flex-1 flex-col gap-1 p-3">
        <p class="text-xs text-slate-500">{{ product.category.name }}</p>
        <h3 class="line-clamp-2 font-medium text-slate-900 group-hover:text-indigo-700">{{ product.name }}</h3>
        <p class="mt-auto font-semibold text-slate-900">{{ formatPrice(product.price) }}</p>
      </div>
    </RouterLink>
    <!-- Outside the link: a button nested in an anchor is invalid interactive content. -->
    <div class="p-3 pt-0">
      <AddToCartButton :product-id="product.id" />
    </div>
  </article>
</template>
