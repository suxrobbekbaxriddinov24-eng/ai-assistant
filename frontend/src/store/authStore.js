import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

export const useAuthStore = create((set, get) => ({
  user: null,          // Supabase auth user
  profile: null,       // Our users table row (includes tier, limits)
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile()
    }
    set({ loading: false })

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ profile: data })
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  get tier() {
    return get().profile?.tier || 'free'
  },

  get limits() {
    return get().profile?.tier_limits || {}
  }
}))
