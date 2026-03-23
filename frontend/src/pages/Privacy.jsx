export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-8 block">← Back</a>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly: email address, name, and conversation history. We also collect usage data such as number of requests and subscription status.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve the Service, process payments, send account-related emails, and personalize your AI experience through memory features.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Data Storage</h2>
            <p>Your data is stored securely using Supabase (PostgreSQL). Conversation history and memories are stored to provide continuity of service. You can delete your data at any time from Settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Third-Party Services</h2>
            <p>We use the following third-party services: Groq (AI processing), Paddle (payment processing), Supabase (database and authentication). Each has their own privacy policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with service providers necessary to operate the Service, and only as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Cookies</h2>
            <p>We use essential cookies for authentication. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact us to exercise these rights. You may also delete your account directly from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Contact</h2>
            <p>For privacy questions, contact us at: support@ai-assistant-sooty-theta.vercel.app</p>
          </section>
        </div>
      </div>
    </div>
  )
}
