import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Whether the backend is slow to answer, e.g. a free-tier server waking up from idle. */
export const useConnectionStore = defineStore('connection', () => {
  const isBackendSlow = ref(false)

  function setBackendSlow(value: boolean): void {
    isBackendSlow.value = value
  }

  return { isBackendSlow, setBackendSlow }
})
