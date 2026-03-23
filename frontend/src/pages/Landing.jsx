import { Link } from 'react-router-dom'
import { TIERS } from '../lib/constants'

const FEATURES = [
  {
    icon: '🎤',
    title: 'Voice Conversations',
    desc: 'Talk to it naturally. It speaks back. No typing required.',
    tier: 'Plus'
  },
  {
    icon: '🖥',
    title: 'Screen Control',
    desc: 'It sees your screen and controls mouse & keyboard to complete tasks for you.',
    tier: 'Pro'
  },
  {
    icon: '🧠',
    title: 'Permanent Memory',
    desc: 'Remembers your name, job, preferences, and projects across every session.',
    tier: 'Plus'
  },
  {
    icon: '🔍',
    title: 'Live Web Search',
    desc: 'Searches the internet for up-to-date information — news, prices, facts.',
    tier: 'Plus'
  },
  {
    icon: '🤖',
    title: 'Background Agent',
    desc: 'Runs tasks while you sleep: monitors emails, fills forms, tracks prices.',
    tier: 'Premium'
  },
  {
    icon: '📴',
    title: 'Works Offline',
    desc: 'Basic mode runs locally on your PC with no internet required.',
    tier: 'Plus'
  }
]

const STEPS = [
  { num: '1', title: 'Sign up free', desc: 'Create your account in seconds. No credit card needed.' },
  { num: '2', title: 'Start chatting', desc: 'Ask anything. It answers instantly with full context of who you are.' },
  { num: '3', title: 'Unlock superpowers', desc: 'Upgrade when ready for voice, screen control, and automation.' }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <span className="font-bold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
          <Link to="/download" className="text-sm text-gray-400 hover:text-white transition-colors">Download</Link>
          <Link
            to="/login"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Powered by Claude AI
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          The AI assistant<br />that actually does things
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Not just a chatbot. An AI that remembers you, speaks to you, controls your screen, and works in the background — like having a personal assistant that runs 24/7 on your PC.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Try Free — No Card Needed
          </Link>
          <Link
            to="/download"
            className="border border-gray-600 hover:border-gray-400 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors"
          >
            Download Desktop App
          </Link>
        </div>

        <p className="text-sm text-gray-600 mt-4">Free plan: 10 messages/day. No credit card required.</p>

        {/* Hero visual */}
        <div className="mt-14 bg-gray-900 rounded-2xl border border-gray-800 p-6 text-left max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 ml-2">AI Assistant</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs">
                Book me a flight to Tokyo next Friday and find a hotel under $150/night
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">AI</div>
              <div className="bg-gray-800 text-gray-100 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-xs">
                On it! I can see your screen. Opening Kayak now... I'll search flights from your location and filter hotels by price.
                <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-1 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
        <p className="text-gray-400 text-center mb-12">Way more than a chatbot</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{f.tier}+</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                {s.num}
              </div>
              <h3 className="font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you need more.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TIERS).map(([key, t]) => {
            const isPopular = key === 'plus'
            return (
              <div
                key={key}
                className={`rounded-2xl p-6 border relative ${
                  isPopular
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-medium text-gray-400 mb-1">{t.name}</div>
                <div className="text-2xl font-bold text-white mb-4">{t.price}</div>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block w-full py-2.5 rounded-xl text-sm font-medium text-center transition-colors ${
                    isPopular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {key === 'free' ? 'Get Started' : `Get ${t.name}`}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-10">
          <h2 className="text-3xl font-bold mb-4">Start for free today</h2>
          <p className="text-gray-400 mb-8">Join thousands of people using AI to get more done every day.</p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Create Free Account
          </Link>
          <p className="text-xs text-gray-600 mt-4">No credit card · Cancel anytime · Free forever plan</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <span className="text-sm text-gray-500">AI Personal Assistant</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/download" className="hover:text-white transition-colors">Download</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <p className="text-xs text-gray-700">© 2026 AI Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
