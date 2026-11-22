import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory } from 'vue-router'

import { createAppRouter } from '@/router'

/** Mounts a component with a fresh Pinia and the real app router on in-memory history. */
export async function mountWithApp(component: Component, initialPath = '/') {
  const router = createAppRouter(createMemoryHistory())
  const pinia = createPinia()
  // The guard runs on the first push, before the app (and therefore Pinia) is installed.
  setActivePinia(pinia)
  await router.push(initialPath)
  await router.isReady()
  const wrapper = mount(component, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router, pinia }
}
