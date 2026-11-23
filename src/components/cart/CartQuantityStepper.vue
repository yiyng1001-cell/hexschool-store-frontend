<script setup lang="ts">
import { canDecreaseQuantity, canIncreaseQuantity } from '@/lib/cartRules'

defineProps<{ quantity: number; productName: string; disabled?: boolean }>()
defineEmits<{ change: [quantity: number] }>()

const buttonClass =
  'h-11 w-11 rounded-md border border-slate-300 bg-white text-lg transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      :class="buttonClass"
      :disabled="disabled || !canDecreaseQuantity(quantity)"
      :aria-label="`減少 ${productName} 的數量`"
      @click="$emit('change', quantity - 1)"
    >
      −
    </button>
    <output
      class="min-w-8 text-center font-medium"
      :aria-label="`${productName} 的數量`"
    >{{ quantity }}</output>
    <button
      type="button"
      :class="buttonClass"
      :disabled="disabled || !canIncreaseQuantity(quantity)"
      :aria-label="`增加 ${productName} 的數量`"
      @click="$emit('change', quantity + 1)"
    >
      +
    </button>
  </div>
</template>
