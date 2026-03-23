import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'

export default function Settings() {
  const { profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await api.patch('/auth/me', null, { params: { display_name: displayName } })
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-gray-400 hover:text-white">←</a>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
          {/* Profile */}
          <div className="p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full bg-gray-800/50 text-gray-500 border border-gray-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Account</h2>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Plan: <span className="text-white font-medium capitalize">{profile?.tier}</span></p>
              <p>Status: <span className="text-green-400 capitalize">{profile?.subscription_status}</span></p>
            </div>
            <a href="/billing" className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300">
              Manage subscription →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
