<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AuthFormField from '@/components/auth/AuthFormField.vue'
import AuthFormShell from '@/components/auth/AuthFormShell.vue'
import { useAuthFormSubmission } from '@/composables/useAuthFormSubmission'
import { validateRegisterForm } from '@/lib/validateAuthForm'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()
const { isSubmitting, fieldErrors, formError, submit } = useAuthFormSubmission()

const form = reactive({ name: '', email: '', password: '' })
const loginLocation = computed(() => ({ name: 'login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }))

function handleSubmit() {
  return submit(
    () => validateRegisterForm(form),
    () =>
      authStore.registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      }),
  )
}
</script>

<template>
  <AuthFormShell
    title="註冊"
    :form-error="formError"
  >
    <form
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <AuthFormField
        id="register-name"
        v-model="form.name"
        label="名稱"
        autocomplete="name"
        :error="fieldErrors.name"
      />
      <AuthFormField
        id="register-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="fieldErrors.email"
      />
      <AuthFormField
        id="register-password"
        v-model="form.password"
        label="密碼（8～72 字元，需含英文與數字）"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
      />
      <button
        type="submit"
        :disabled="isSubmitting"
        class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isSubmitting ? '註冊中…' : '註冊' }}
      </button>
    </form>
    <p class="text-sm text-slate-600">
      已經有帳號？
      <RouterLink
        :to="loginLocation"
        class="text-indigo-600 underline hover:text-indigo-800"
      >登入</RouterLink>
    </p>
  </AuthFormShell>
</template>
