import api from '../../lib/api'

const STATUS_CONFIG = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending', icon: '⏳' },
  running: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Running', icon: '▶' },
  waiting_approval: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Needs Approval', icon: '⚠' },
  completed: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Done', icon: '✓' },
  failed: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed', icon: '✗' },
  cancelled: { color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Cancelled', icon: '—' },
}

export function TaskCard({ task, onUpdate }) {
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending

  const handleCancel = async () => {
    await api.post(`/agent/tasks/${task.id}/cancel`)
    onUpdate?.()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              {status.icon} {status.label}
            </span>
            <span className="text-xs text-gray-600 capitalize">{task.trigger_type}</span>
          </div>
          <h3 className="text-sm font-medium text-white truncate">{task.title}</h3>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
          )}
          {task.result?.message && (
            <p className="text-xs text-gray-400 mt-1 italic">"{task.result.message}"</p>
          )}
        </div>
        {(task.status === 'pending' || task.status === 'running') && (
          <button
            onClick={handleCancel}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
          >
            Cancel
          </button>
        )}
      </div>
      <div className="text-xs text-gray-700 mt-2">
        {new Date(task.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}
