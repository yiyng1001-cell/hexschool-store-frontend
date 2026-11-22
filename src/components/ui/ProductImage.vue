<script setup lang="ts">
import { ref } from 'vue'

import placeholderUrl from '@/assets/image-placeholder.svg'

defineProps<{ src: string; alt: string }>()

const hasFailed = ref(false)
</script>

<template>
  <img
    :src="hasFailed ? placeholderUrl : src"
    :alt="alt"
    loading="lazy"
    class="aspect-square h-full w-full object-cover"
    @error="hasFailed = true"
  >
</template>
