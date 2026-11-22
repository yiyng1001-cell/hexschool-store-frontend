<script setup lang="ts">
import { formatPrice } from '@/lib/formatPrice'

defineProps<{ totalQuantity: number; totalPrice: number }>()
</script>

<template>
  <section
    aria-label="購物車總計"
    class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4"
    aria-live="polite"
  >
    <p class="flex justify-between text-slate-600">
      <span>商品數量</span>
      <span>{{ totalQuantity }} 件</span>
    </p>
    <p class="flex justify-between text-lg font-semibold text-slate-900">
      <span>總計</span>
      <span>{{ formatPrice(totalPrice) }}</span>
    </p>
  </section>
</template>
