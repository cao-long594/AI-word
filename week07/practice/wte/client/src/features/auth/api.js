import { apiRequest } from '../../shared/api/client'

export function login(payload) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe() {
  return apiRequest('/api/auth/me')
}
