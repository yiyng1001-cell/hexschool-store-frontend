<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <section
    class="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-12 text-center"
    role="alert"
  >
    <p class="text-red-700">
      {{ message }}
    </p>
    <button
      type="button"
      class="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
      @click="$emit('retry')"
    >
      重試
    </button>
  </section>
</template>
