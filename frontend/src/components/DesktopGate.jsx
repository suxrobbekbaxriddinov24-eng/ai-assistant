import { useAuth } from '../hooks/useAuth'
import { TIERS } from '../lib/constants'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export default function DesktopGate() {
  const { signOut } = useAuth()

  const paidTiers = ['plus', 'pro', 'premium']

  const openBilling = () => {
    // In electron, open billing in external browser
    if (window.electronAPI) {
      window.open('https://ai-assistant-sooty-theta.vercel.app/billing', '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg shadow-blue-500/20">
        H
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Humanoid Desktop</h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">
        The desktop app requires a paid plan. Upgrade to unlock the full experience.
      </p>

      {/* Tier cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xl mb-8">
        {paidTiers.map(key => {
          const t = TIERS[key]
          return (
            <div
              key={key}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors"
            >
              <div className="text-sm font-semibold text-white mb-1">{t.name}</div>
              <div className="text-xl font-bold text-white mb-3">{t.price}</div>
              <ul className="text-xs text-gray-400 space-y-1 mb-4 text-left">
                {t.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={openBilling}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 rounded-xl transition-colors"
              >
                Get {t.name}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={openBilling}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          Use web version instead →
        </button>
        <button
          onClick={signOut}
          className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
