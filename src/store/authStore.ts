import { create } from 'zustand'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'engineer'
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('sla_user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  })(),
  token: localStorage.getItem('sla_token'),

  setAuth: (user, token) => {
    localStorage.setItem('sla_token', token)
    localStorage.setItem('sla_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('sla_token')
    localStorage.removeItem('sla_user')
    set({ user: null, token: null })
  },
}))
