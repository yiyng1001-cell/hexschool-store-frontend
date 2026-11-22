<script setup lang="ts">
defineProps<{ title: string; formError: string }>()
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
    <h1 class="text-2xl font-bold text-slate-900">
      {{ title }}
    </h1>
    <p
      v-if="formError"
      class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ formError }}
    </p>
    <slot />
  </main>
</template>
