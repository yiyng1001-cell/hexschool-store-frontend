import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { AuthFieldErrors, AuthResult } from '@/lib/authFailure'
import { describeAuthFailure } from '@/lib/authFailure'
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirectPath'

export function useAuthFormSubmission() {
  const route = useRoute()
  const router = useRouter()
  const isSubmitting = ref(false)
  const fieldErrors = ref<AuthFieldErrors>({})
  const formError = ref('')

  async function submit(
    validate: () => AuthFieldErrors,
    send: () => Promise<AuthResult>,
  ): Promise<void> {
    if (isSubmitting.value) return
    formError.value = ''
    fieldErrors.value = validate()
    if (Object.keys(fieldErrors.value).length > 0) return

    isSubmitting.value = true
    try {
      const result = await send()
      if (result.ok) {
        await router.replace(sanitizeRedirectPath(route.query.redirect))
        return
      }
      const message = describeAuthFailure(result.failure)
      fieldErrors.value = message.fieldErrors
      formError.value = message.formError
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, fieldErrors, formError, submit }
}
