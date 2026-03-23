import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      voiceEnabled: true,
      alwaysListening: false,
      notificationSound: true,
      memoryEnabled: true,
      autoSpeak: false,          // AI speaks responses automatically
      language: 'en',

      setTheme: (theme) => set({ theme }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setAlwaysListening: (v) => set({ alwaysListening: v }),
      setNotificationSound: (v) => set({ notificationSound: v }),
      setMemoryEnabled: (v) => set({ memoryEnabled: v }),
      setAutoSpeak: (v) => set({ autoSpeak: v }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'ai-assistant-settings' }
  )
)
