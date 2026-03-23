import { useEffect } from 'react'
import { useAgent } from '../../hooks/useAgent'
import { TaskCard } from './TaskCard'

export function TaskFeed() {
  const { tasks, loading, loadTasks } = useAgent()

  useEffect(() => {
    loadTasks()
    // Poll every 10 seconds while component is visible
    const interval = setInterval(loadTasks, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        No tasks yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
      ))}
    </div>
  )
}
