import { describe, expect, it, vi, beforeEach } from 'vitest'

import { apiRequest } from './client'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('apiRequest', () => {
  it('returns payload data for successful requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { ok: true } }),
      }),
    )

    await expect(apiRequest('/api/test')).resolves.toEqual({ ok: true })
  })

  it('throws ApiError with backend message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: { code: 'username_taken', message: 'username already exists' } }),
      }),
    )

    await expect(apiRequest('/api/test')).rejects.toMatchObject({
      message: 'username already exists',
      status: 409,
      code: 'username_taken',
    })
  })
})
