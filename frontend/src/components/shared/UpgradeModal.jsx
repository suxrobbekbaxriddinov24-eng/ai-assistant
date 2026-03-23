import { useState } from 'react'
import { useSubscription } from '../../hooks/useSubscription'
import { TIERS } from '../../lib/constants'

export function UpgradeModal({ isOpen, onClose, requiredTier, featureName }) {
  const { upgrade } = useSubscription()
  const [loading, setLoading] = useState(null)

  if (!isOpen) return null

  const tiers = ['plus', 'pro', 'premium'].map(t => TIERS[t])

  const handleUpgrade = async (tier) => {
    setLoading(tier)
    try {
      await upgrade(tier)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Upgrade your plan</h2>
            <p className="text-gray-400 text-sm mt-1">
              {featureName ? `"${featureName}" requires a higher plan` : 'Unlock more powerful features'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {['plus', 'pro', 'premium'].map((tier) => {
            const t = TIERS[tier]
            const isRecommended = tier === (requiredTier || 'plus')
            return (
              <div
                key={tier}
                className={`rounded-xl p-4 border ${isRecommended ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{t.name}</span>
                  {isRecommended && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                </div>
                <div className="text-lg font-bold text-white mb-3">{t.price}</div>
                <ul className="space-y-1 mb-4">
                  {t.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-center gap-1">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loading === tier}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {loading === tier ? 'Loading...' : `Get ${t.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
