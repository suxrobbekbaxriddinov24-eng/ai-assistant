import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../hooks/useAuth'
import { TIERS } from '../lib/constants'
import { useState } from 'react'

export default function Billing() {
  const { tier, upgrade, manageSubscription, requestsLeft } = useSubscription()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(null)

  const handleUpgrade = async (t) => {
    setLoading(t)
    try { await upgrade(t) }
    finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-gray-400 hover:text-white">←</a>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
        </div>

        {/* Current plan banner */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current plan</p>
            <p className="text-xl font-bold mt-1">{TIERS[tier]?.name || 'Free'}</p>
            <p className="text-sm text-gray-400 mt-1">
              {requestsLeft() === Infinity ? 'Unlimited' : `${requestsLeft()} requests`} remaining today
            </p>
          </div>
          {tier !== 'free' && (
            <button
              onClick={manageSubscription}
              className="text-sm border border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Manage subscription
            </button>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TIERS).map(([key, t]) => {
            const isCurrent = key === tier
            return (
              <div
                key={key}
                className={`rounded-2xl p-5 border ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-900'
                }`}
              >
                <div className="text-sm font-medium text-gray-400 mb-1">{t.name}</div>
                <div className="text-2xl font-bold mb-4">{t.price}</div>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Current Plan
                  </div>
                ) : key === 'free' ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-gray-500">
                    —
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={loading === key}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    {loading === key ? 'Loading...' : `Upgrade to ${t.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          Payments processed securely by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
