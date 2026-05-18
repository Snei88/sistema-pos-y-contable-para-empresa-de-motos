import { create } from 'zustand'
import type { SessionUser } from '../../../shared/types/index'

interface AuthState {
  user:        SessionUser | null
  isLoading:   boolean
  error:       string | null
  login:       (username: string, password: string) => Promise<boolean>
  logout:      () => Promise<void>
  loadSession: () => Promise<void>
  clearError:  () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoading: true, // ← empezar en true para evitar flash
  error:     null,

  loadSession: async () => {
    set({ isLoading: true })
    const res = await window.api.getSession()
    if (res.success && res.data) {
      set({ user: res.data, isLoading: false })
    } else {
      set({ user: null, isLoading: false })
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    const res = await window.api.login({ username, password })
    if (res.success && res.data) {
      set({ user: res.data, isLoading: false })
      return true
    }
    set({ error: res.error ?? 'Error al iniciar sesión', isLoading: false })
    return false
  },

  logout: async () => {
    await window.api.logout()
    set({ user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))