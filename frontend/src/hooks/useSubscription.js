import { useCallback } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export function useSubscription() {
  const { profile, fetchProfile } = useAuthStore()

  const upgrade = useCallback(async (tier) => {
    const { data } = await api.post(`/billing/create-checkout/${tier}`)
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank')
    }
  }, [])

  const manageSubscription = useCallback(async () => {
    const { data } = await api.post('/billing/portal')
    if (data.portal_url) {
      window.open(data.portal_url, '_blank')
    }
  }, [])

  const hasFeature = useCallback((feature) => {
    return !!profile?.tier_limits?.[feature]
  }, [profile])

  const requestsLeft = useCallback(() => {
    const limit = profile?.tier_limits?.daily_request_limit
    if (limit === -1) return Infinity
    return Math.max(0, (limit || 10) - (profile?.requests_today || 0))
  }, [profile])

  return {
    tier: profile?.tier || 'free',
    upgrade,
    manageSubscription,
    hasFeature,
    requestsLeft,
    refreshProfile: fetchProfile
  }
}
