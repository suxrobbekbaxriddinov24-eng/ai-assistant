import { create } from 'zustand'

export const useAgentStore = create((set) => ({
  tasks: [],
  loading: false,

  setTasks: (tasks) => set({ tasks }),
  setLoading: (loading) => set({ loading }),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    })),

  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
}))
