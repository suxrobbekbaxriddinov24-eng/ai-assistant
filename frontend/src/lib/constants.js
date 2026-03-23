export const TIERS = {
  free: {
    name: 'Free',
    price: '$0',
    color: '#6b7280',
    features: ['10 messages/day', 'Text chat only', 'Basic AI (Haiku)'],
    limits: { daily: 10 }
  },
  plus: {
    name: 'Plus',
    price: '$9/mo',
    color: '#3b82f6',
    features: ['100 messages/day', 'Voice in & out', 'Web search', 'File management', 'Memory', 'Offline mode'],
    limits: { daily: 100 }
  },
  pro: {
    name: 'Pro',
    price: '$29/mo',
    color: '#8b5cf6',
    features: ['500 messages/day', 'Screen control', 'Priority speed', 'Advanced automation', 'Everything in Plus'],
    limits: { daily: 500 }
  },
  premium: {
    name: 'Premium',
    price: '$79/mo',
    color: '#f59e0b',
    features: ['Unlimited messages', 'Always-on agent', 'Background tasks', 'Top-tier AI (Opus)', 'Everything in Pro'],
    limits: { daily: -1 }
  }
}

export const FEATURE_TIER = {
  has_voice: 'plus',
  has_web_search: 'plus',
  has_file_management: 'plus',
  has_screen_control: 'pro',
  has_agent: 'premium',
}
