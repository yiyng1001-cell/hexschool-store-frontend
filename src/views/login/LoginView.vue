<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AuthFormField from '@/components/auth/AuthFormField.vue'
import AuthFormShell from '@/components/auth/AuthFormShell.vue'
import { useAuthFormSubmission } from '@/composables/useAuthFormSubmission'
import { validateLoginForm } from '@/lib/validateAuthForm'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()
const { isSubmitting, fieldErrors, formError, submit } = useAuthFormSubmission()

const form = reactive({ email: '', password: '' })
const registerLocation = computed(() => ({ name: 'register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }))

function handleSubmit() {
  return submit(
    () => validateLoginForm(form),
    () => authStore.loginUser({ email: form.email.trim(), password: form.password }),
  )
}
</script>

<template>
  <AuthFormShell
    title="登入"
    :form-error="formError"
  >
    <form
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <AuthFormField
        id="login-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="fieldErrors.email"
      />
      <AuthFormField
        id="login-password"
        v-model="form.password"
        label="密碼"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
      />
      <button
        type="submit"
        :disabled="isSubmitting"
        class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isSubmitting ? '登入中…' : '登入' }}
      </button>
    </form>
    <p class="text-sm text-slate-600">
      還沒有帳號？
      <RouterLink
        :to="registerLocation"
        class="text-indigo-600 underline hover:text-indigo-800"
      >註冊</RouterLink>
    </p>
  </AuthFormShell>
</template>
