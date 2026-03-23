import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const { user, profile, loading, init, signOut, fetchProfile } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUpWithEmail = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    isLoggedIn: !!user,
    tier: profile?.tier || 'free',
    limits: profile?.tier_limits || {},
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile: fetchProfile
  }
}
