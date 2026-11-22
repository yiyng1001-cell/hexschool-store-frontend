<script setup lang="ts">
import { computed } from 'vue'

import { useCartActions } from '@/composables/useCartActions'
import { canIncreaseQuantity } from '@/lib/cartRules'
import { useCartStore } from '@/stores/cartStore'

const props = defineProps<{ productId: string }>()

const cartStore = useCartStore()
const { addToCart } = useCartActions()

const isPending = computed(() => cartStore.pendingProductIds.includes(props.productId))
const isAtLimit = computed(() => {
  const quantity = cartStore.quantityOf(props.productId)
  return quantity !== null && !canIncreaseQuantity(quantity)
})
const label = computed(() => {
  if (isPending.value) return '加入中…'
  return isAtLimit.value ? '已達單項上限' : '加入購物車'
})
</script>

<template>
  <button
    type="button"
    :disabled="isPending || isAtLimit"
    class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
    @click="addToCart(productId)"
  >
    {{ label }}
  </button>
</template>
