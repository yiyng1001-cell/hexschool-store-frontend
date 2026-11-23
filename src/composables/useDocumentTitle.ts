import { watchEffect } from 'vue'
import type { Ref } from 'vue'

import { buildPageTitle } from '@/lib/pageTitle'

/** Sets the browser tab title from a page-specific name, for titles known only after data has loaded. */
export function useDocumentTitle(pageName: Ref<string | null>): void {
  watchEffect(() => {
    document.title = buildPageTitle(pageName.value)
  })
}
