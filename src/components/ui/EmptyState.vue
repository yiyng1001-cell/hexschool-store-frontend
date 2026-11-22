<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
    <h2 class="text-lg font-semibold text-slate-900">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="text-slate-600"
    >
      {{ description }}
    </p>
    <slot />
  </section>
</template>
