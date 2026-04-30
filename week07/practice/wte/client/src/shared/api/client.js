import { queryClient } from '../lib/queryClient'
import { clearAuthSession, getAuthToken } from '../../features/auth/authStore'

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers ?? {})
  const token = getAuthToken()

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...options,
    headers,
  })

  const payload = await parseBody(response)

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Request failed'
    const code = payload?.error?.code ?? 'request_failed'

    if (response.status === 401) {
      clearAuthSession()
      queryClient.clear()
    }

    throw new ApiError(message, response.status, code)
  }

  return payload?.data ?? payload
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }
  return response.json()
}
