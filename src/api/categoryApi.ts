import { apiClient } from './apiClient'
import type { HttpClient } from './httpClient'
import type { components } from './types'

export type Category = components['schemas']['Category']

export interface CategoryApi {
  listCategories(signal?: AbortSignal): Promise<Category[]>
}

export function createCategoryApi(client: HttpClient): CategoryApi {
  return {
    async listCategories(signal) {
      const data = await client.request<{ items: Category[] }>('GET', '/api/categories', {
        signal,
        requiresAuth: false,
      })
      return data.items
    },
  }
}

export const categoryApi = createCategoryApi(apiClient)
