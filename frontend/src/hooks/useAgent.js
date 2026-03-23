import { useCallback } from 'react'
import { useAgentStore } from '../store/agentStore'
import api from '../lib/api'

export function useAgent() {
  const { tasks, loading, setTasks, setLoading, addTask, removeTask } = useAgentStore()

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/agent/tasks')
      setTasks(data)
    } catch (e) {
      console.error('Failed to load tasks', e)
    } finally {
      setLoading(false)
    }
  }, [setTasks, setLoading])

  const createTask = useCallback(async (title, description = '', triggerType = 'manual') => {
    const { data } = await api.post('/agent/tasks', null, {
      params: { title, description, trigger_type: triggerType }
    })
    await loadTasks()
    return data
  }, [loadTasks])

  const cancelTask = useCallback(async (taskId) => {
    await api.post(`/agent/tasks/${taskId}/cancel`)
    await loadTasks()
  }, [loadTasks])

  return { tasks, loading, loadTasks, createTask, cancelTask }
}
