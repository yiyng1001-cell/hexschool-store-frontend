<script setup lang="ts">
defineProps<{
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  autocomplete: string
  error?: string
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="id"
      class="text-sm font-medium text-slate-700"
    >{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="rounded-md border border-slate-300 px-3 py-2 text-base transition hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 aria-invalid:border-red-500"
    >
    <p
      v-if="error"
      :id="`${id}-error`"
      class="text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
