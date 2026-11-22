import { ApiHttpError, ApiNetworkError, isAbortError } from './apiError'
import type { ApiErrorCode, ApiFieldError, BackendErrorCode } from './apiError'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  readonly body?: unknown
  readonly signal?: AbortSignal
  readonly requiresAuth?: boolean
  /** false for requests whose 401 is handled by the caller (login, register, session restore). */
  readonly handleUnauthorized?: boolean
}

export interface HttpClient {
  request<TResponseData>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions,
  ): Promise<TResponseData>
}

export interface HttpClientDependencies {
  readonly baseUrl: string
  readonly fetchImplementation: typeof fetch
  readonly readAccessToken: () => string | null
  readonly onUnauthorized: () => void
}

const KNOWN_ERROR_CODES: readonly BackendErrorCode[] = [
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_ALREADY_EXISTS',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toErrorCode(value: unknown): ApiErrorCode {
  return KNOWN_ERROR_CODES.find((code) => code === value) ?? 'UNKNOWN_ERROR'
}

function toFieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry): ApiFieldError[] =>
    isRecord(entry) && typeof entry.field === 'string' && typeof entry.message === 'string'
      ? [{ field: entry.field, message: entry.message }]
      : [],
  )
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') return null
  try {
    return JSON.parse(text)
  } catch (error) {
    console.warn('http_client.non_json_body', { status: response.status, error })
    return null
  }
}

export function normalizeErrorResponse(status: number, body: unknown): ApiHttpError {
  const errorBody = isRecord(body) && isRecord(body.error) ? body.error : {}
  return new ApiHttpError({
    status,
    code: toErrorCode(errorBody.code),
    message: typeof errorBody.message === 'string' ? errorBody.message : `HTTP ${status}`,
    details: toFieldErrors(errorBody.details),
  })
}

function buildHeaders(options: RequestOptions, token: string | null): Headers {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.requiresAuth !== false && token !== null) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

function unwrapSuccessData<TResponseData>(body: unknown): TResponseData {
  if (isRecord(body) && body.success === true && 'data' in body) {
    return body.data as TResponseData
  }
  return undefined as TResponseData
}

export function createHttpClient(dependencies: HttpClientDependencies): HttpClient {
  async function send(method: HttpMethod, path: string, options: RequestOptions) {
    try {
      return await dependencies.fetchImplementation(`${dependencies.baseUrl}${path}`, {
        method,
        headers: buildHeaders(options, dependencies.readAccessToken()),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      })
    } catch (error) {
      if (isAbortError(error)) throw error
      throw new ApiNetworkError(error)
    }
  }

  async function request<TResponseData>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<TResponseData> {
    const response = await send(method, path, options)
    const body = await readJsonBody(response)
    if (response.ok) return unwrapSuccessData<TResponseData>(body)

    const error = normalizeErrorResponse(response.status, body)
    if (error.code === 'UNAUTHORIZED' && options.handleUnauthorized !== false) {
      dependencies.onUnauthorized()
    }
    throw error
  }

  return { request }
}
