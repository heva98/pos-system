import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('pos_token') || null,
  isAuthenticated: !!localStorage.getItem('pos_token'),

  login: async (username, password) => {
    const res = await authAPI.login(username, password)
    const { access_token, user } = res.data
    localStorage.setItem('pos_token', access_token)
    set({ token: access_token, user, isAuthenticated: true })
    return user
  },

  logout: () => {
    localStorage.removeItem('pos_token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const res = await authAPI.me()
      set({ user: res.data })
    } catch {
      localStorage.removeItem('pos_token')
      set({ token: null, user: null, isAuthenticated: false })
    }
  },
}))

export default useAuthStore