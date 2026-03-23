import { useState } from 'react'
import { useAgent } from '../hooks/useAgent'
import { useSubscription } from '../hooks/useSubscription'
import { TaskFeed } from '../components/agent/TaskFeed'
import { UpgradeModal } from '../components/shared/UpgradeModal'
import { Link } from 'react-router-dom'

export default function Agent() {
  const { createTask } = useAgent()
  const { hasFeature } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(!hasFeature('has_agent'))
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    try {
      await createTask(title, description, 'manual')
      setTitle('')
      setDescription('')
    } finally {
      setCreating(false)
    }
  }

  if (!hasFeature('has_agent')) {
    return (
      <>
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-bold mb-2">Always-On Agent</h2>
            <p className="text-gray-400 text-sm mb-6">
              The background agent runs tasks while you're away — monitoring, automating, and acting on your behalf. Available on Premium.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Upgrade to Premium
            </button>
            <div className="mt-4">
              <Link to="/" className="text-sm text-gray-500 hover:text-white">← Back</Link>
            </div>
          </div>
        </div>
        <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} requiredTier="premium" featureName="Background Agent" />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-400 hover:text-white text-sm">←</Link>
          <div>
            <h1 className="text-xl font-bold">Background Agent</h1>
            <p className="text-xs text-gray-500">Tasks that run automatically</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Active</span>
          </div>
        </div>

        {/* Create task */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-medium text-white mb-4">Create New Task</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Task title (e.g. Monitor Amazon price for iPhone)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-gray-800 text-white placeholder-gray-600 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Description (optional) — what exactly should the agent do?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 text-white placeholder-gray-600 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>

        {/* Task feed */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">All Tasks</h2>
          <TaskFeed />
        </div>
      </div>
    </div>
  )
}
