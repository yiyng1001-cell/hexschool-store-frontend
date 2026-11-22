<script setup lang="ts">
import { RouterLink } from 'vue-router'

import ProductImage from '@/components/ui/ProductImage.vue'
import { formatPrice } from '@/lib/formatPrice'
import type { CartItem } from '@/api/cartApi'

import CartQuantityStepper from './CartQuantityStepper.vue'

defineProps<{ item: CartItem; isPending: boolean }>()
defineEmits<{ changeQuantity: [quantity: number]; remove: [] }>()
</script>

<template>
  <li
    class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
    :class="{ 'opacity-70': !item.available }"
    :aria-busy="isPending ? 'true' : undefined"
  >
    <div class="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
      <ProductImage
        :src="item.product.imageUrl"
        :alt="item.product.name"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <p class="text-xs text-slate-500">
        {{ item.product.category.name }}
      </p>
      <h3 class="font-medium text-slate-900">
        <RouterLink
          v-if="item.available"
          :to="{ name: 'productDetail', params: { id: item.product.id } }"
          class="hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {{ item.product.name }}
        </RouterLink>
        <span
          v-else
          class="line-through"
        >{{ item.product.name }}</span>
      </h3>
      <p class="text-sm text-slate-600">
        單價 {{ formatPrice(item.product.price) }}
      </p>
      <p
        v-if="!item.available"
        class="text-sm font-medium text-red-600"
      >
        已下架，無法購買，請移除
      </p>
    </div>

    <CartQuantityStepper
      v-if="item.available"
      :quantity="item.quantity"
      :product-name="item.product.name"
      :disabled="isPending"
      @change="$emit('changeQuantity', $event)"
    />
    <p
      v-else
      class="text-sm text-slate-500"
    >
      數量 {{ item.quantity }}
    </p>

    <p
      v-if="item.available"
      class="w-28 font-semibold text-slate-900 sm:text-right"
    >
      {{ formatPrice(item.subtotal) }}
    </p>

    <button
      type="button"
      :disabled="isPending"
      class="self-start rounded-md px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 sm:self-auto"
      :aria-label="`移除 ${item.product.name}`"
      @click="$emit('remove')"
    >
      移除
    </button>
  </li>
</template>
