<script setup lang="ts">
import { RouterLink } from 'vue-router'

import CartItemRow from '@/components/cart/CartItemRow.vue'
import CartSummary from '@/components/cart/CartSummary.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { useCartActions } from '@/composables/useCartActions'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()
const { changeQuantity, removeItem } = useCartActions()
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-900">
      購物車
    </h1>

    <ErrorState
      v-if="cartStore.state.status === 'error' && cartStore.cart === null"
      message="無法載入購物車，請稍後再試"
      @retry="cartStore.loadCart"
    />

    <div
      v-else-if="cartStore.cart === null"
      class="flex animate-pulse flex-col gap-3"
      aria-busy="true"
    >
      <div
        v-for="index in 3"
        :key="index"
        class="h-28 rounded-lg bg-slate-200"
      />
    </div>

    <EmptyState
      v-else-if="cartStore.cart.items.length === 0"
      title="購物車是空的"
      description="挑幾樣喜歡的商品吧。"
    >
      <RouterLink
        :to="{ name: 'products' }"
        class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        前往商品列表
      </RouterLink>
    </EmptyState>

    <template v-else>
      <p
        v-if="cartStore.state.status === 'error'"
        class="flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        role="alert"
      >
        無法更新購物車，顯示的可能不是最新內容。
        <button
          type="button"
          class="underline"
          @click="cartStore.loadCart"
        >
          重試
        </button>
      </p>
      <ul class="flex flex-col gap-3">
        <CartItemRow
          v-for="item in cartStore.cart.items"
          :key="item.product.id"
          :item="item"
          :is-pending="cartStore.pendingProductIds.includes(item.product.id)"
          @change-quantity="changeQuantity(item.product.id, $event)"
          @remove="removeItem(item.product.id)"
        />
      </ul>
      <CartSummary
        :total-quantity="cartStore.cart.totalQuantity"
        :total-price="cartStore.cart.totalPrice"
      />
    </template>
  </main>
</template>
