import { Link } from 'react-router-dom'

const REQUIREMENTS = [
  { label: 'OS', value: 'Windows 10 or later (64-bit)' },
  { label: 'RAM', value: '4 GB minimum (8 GB recommended)' },
  { label: 'Storage', value: '500 MB free disk space' },
  { label: 'Internet', value: 'Required for AI features (offline mode available on Plus+)' },
]

export default function Download() {
  // Replace this URL with your actual GitHub Release .exe URL after building
  const WINDOWS_DOWNLOAD_URL = 'https://github.com/YOUR_USERNAME/ai-assistant/releases/latest/download/AI.Assistant.Setup.exe'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <span className="font-bold text-white">AI Assistant</span>
        </Link>
        <Link
          to="/login"
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          Sign In
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-blue-500/25">
          AI
        </div>

        <h1 className="text-4xl font-bold mb-3">Download AI Assistant</h1>
        <p className="text-gray-400 text-lg mb-10">
          Install the desktop app for the full experience — voice, screen control, and system tray.
        </p>

        {/* Windows download */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-4 hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🪟</div>
            <div className="text-left flex-1">
              <div className="font-semibold text-white">Windows</div>
              <div className="text-sm text-gray-400">Windows 10 / 11 — 64-bit</div>
            </div>
            <a
              href={WINDOWS_DOWNLOAD_URL}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
            >
              Download .exe
            </a>
          </div>
        </div>

        {/* Mac — coming soon */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-4 opacity-60">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🍎</div>
            <div className="text-left flex-1">
              <div className="font-semibold text-white">macOS</div>
              <div className="text-sm text-gray-500">Coming soon</div>
            </div>
            <div className="bg-gray-800 text-gray-500 px-5 py-2.5 rounded-xl font-medium text-sm">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Linux — coming soon */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-10 opacity-60">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🐧</div>
            <div className="text-left flex-1">
              <div className="font-semibold text-white">Linux</div>
              <div className="text-sm text-gray-500">Coming soon</div>
            </div>
            <div className="bg-gray-800 text-gray-500 px-5 py-2.5 rounded-xl font-medium text-sm">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Steps after download */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left mb-8">
          <h3 className="font-semibold text-white mb-4">After downloading:</h3>
          <ol className="space-y-3">
            {[
              'Run the .exe installer (click "More info" → "Run anyway" if Windows warns you)',
              'AI Assistant opens automatically',
              'Create your free account or sign in',
              'Start chatting — 10 free messages every day',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Use web version instead */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Don't want to install anything?</p>
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Use the web version instead →
          </Link>
        </div>

        {/* System requirements */}
        <div className="mt-12 text-left">
          <h3 className="text-sm font-medium text-gray-400 mb-4">System Requirements</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {REQUIREMENTS.map((r) => (
              <div key={r.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-xs text-gray-300">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
