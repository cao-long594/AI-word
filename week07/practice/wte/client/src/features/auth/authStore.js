import { useEffect, useMemo } from 'react'
import { create } from 'zustand'

import { queryClient } from '../../shared/lib/queryClient'

const STORAGE_KEY = 'wte.auth'

export const useAuthStore = create((set) => ({
  token: '',
  user: null,
  bootstrapped: false,
  setSession: ({ token, user }) => set({ token, user, bootstrapped: true }),
  clearSession: () => set({ token: '', user: null, bootstrapped: true }),
  markBootstrapped: () => set({ bootstrapped: true }),
}))

export function getAuthToken() {
  return useAuthStore.getState().token
}

export function persistAuthSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  useAuthStore.getState().setSession(session)
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY)
  useAuthStore.getState().clearSession()
}

export function logout() {
  clearAuthSession()
  queryClient.clear()
  window.location.assign('/login')
}

export function useAuthBootstrap() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)

  useEffect(() => {
    if (bootstrapped) {
      return
    }

    const { setSession, markBootstrapped } = useAuthStore.getState()
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      markBootstrapped()
      return
    }

    try {
      const parsed = JSON.parse(saved)
      if (parsed?.token && parsed?.user) {
        setSession(parsed)
        return
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }

    markBootstrapped()
  }, [bootstrapped])

  return useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      bootstrapped,
      user,
    }),
    [bootstrapped, token, user],
  )
}
