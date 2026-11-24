<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center">
    <p class="text-6xl font-bold text-indigo-600">
      404
    </p>
    <h1 class="text-2xl font-bold text-slate-900">
      找不到這個頁面
    </h1>
    <p class="max-w-prose text-slate-600">
      網址可能輸入錯誤，或頁面已經移除。
    </p>
    <div class="flex flex-wrap justify-center gap-3">
      <RouterLink
        :to="{ name: 'home' }"
        class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        回首頁
      </RouterLink>
      <RouterLink
        :to="{ name: 'products' }"
        class="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        瀏覽商品
      </RouterLink>
    </div>
  </main>
</template>
