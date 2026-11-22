import { describe, expect, it, vi } from 'vitest'

import { ApiHttpError, ApiNetworkError } from './apiError'
import { createHttpClient } from './httpClient'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === null ? null : JSON.stringify(body), { status })
}

function buildClient(fetchImplementation: typeof fetch, token: string | null = 'token-1') {
  const onUnauthorized = vi.fn()
  const client = createHttpClient({
    baseUrl: 'http://api.test',
    fetchImplementation,
    readAccessToken: () => token,
    onUnauthorized,
  })
  return { client, onUnauthorized }
}

describe('createHttpClient', () => {
  it('unwraps data and sends the bearer token and JSON body', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { ok: 1 } }))
    const { client } = buildClient(fetchImplementation)

    const data = await client.request('POST', '/x', { body: { a: 1 } })

    expect(data).toEqual({ ok: 1 })
    const [url, init] = fetchImplementation.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://api.test/x')
    expect(init.body).toBe('{"a":1}')
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token-1')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('omits Authorization when requiresAuth is false', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: {} }))
    const { client } = buildClient(fetchImplementation)

    await client.request('POST', '/login', { requiresAuth: false })

    expect((fetchImplementation.mock.calls[0][1].headers as Headers).has('Authorization')).toBe(false)
  })

  it.each([
    [400, 'VALIDATION_ERROR'],
    [401, 'INVALID_CREDENTIALS'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'EMAIL_ALREADY_EXISTS'],
  ])('normalizes %i %s into ApiHttpError', async (status, code) => {
    const body = { success: false, error: { code, message: 'm', details: [{ field: 'email', message: 'bad' }] } }
    const { client } = buildClient(vi.fn().mockResolvedValue(jsonResponse(status, body)))

    await expect(client.request('GET', '/x', { handleUnauthorized: false })).rejects.toMatchObject({
      name: 'ApiHttpError',
      status,
      code,
      details: [{ field: 'email', message: 'bad' }],
    })
  })

  it('normalizes a 5xx with a non-JSON body into UNKNOWN_ERROR', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { client } = buildClient(vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })))

    const error = await client.request('GET', '/x').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiHttpError)
    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' })
    expect(warn).toHaveBeenCalled()
  })

  it('wraps fetch failures as ApiNetworkError', async () => {
    const { client } = buildClient(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(client.request('GET', '/x')).rejects.toBeInstanceOf(ApiNetworkError)
  })

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    const { client } = buildClient(vi.fn().mockRejectedValue(abort))

    await expect(client.request('GET', '/x')).rejects.toBe(abort)
  })

  it('calls onUnauthorized for UNAUTHORIZED by default', async () => {
    const body = { success: false, error: { code: 'UNAUTHORIZED', message: 'x' } }
    const { client, onUnauthorized } = buildClient(vi.fn().mockResolvedValue(jsonResponse(401, body)))

    await expect(client.request('GET', '/me')).rejects.toBeInstanceOf(ApiHttpError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not call onUnauthorized for INVALID_CREDENTIALS', async () => {
    const body = { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'x' } }
    const { client, onUnauthorized } = buildClient(vi.fn().mockResolvedValue(jsonResponse(401, body)))

    await expect(client.request('POST', '/login')).rejects.toBeInstanceOf(ApiHttpError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('does not call onUnauthorized when handleUnauthorized is false', async () => {
    const body = { success: false, error: { code: 'UNAUTHORIZED', message: 'x' } }
    const { client, onUnauthorized } = buildClient(vi.fn().mockResolvedValue(jsonResponse(401, body)))

    await expect(client.request('GET', '/me', { handleUnauthorized: false })).rejects.toBeInstanceOf(ApiHttpError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
