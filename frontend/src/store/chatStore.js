import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],          // messages for active conversation
  isStreaming: false,
  streamingText: '',

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  startStreaming: () => set({ isStreaming: true, streamingText: '' }),
  appendChunk: (chunk) => set((state) => ({ streamingText: state.streamingText + chunk })),
  finishStreaming: () => {
    const { streamingText, messages } = get()
    if (streamingText) {
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: streamingText, id: Date.now() }],
        isStreaming: false,
        streamingText: ''
      }))
    } else {
      set({ isStreaming: false, streamingText: '' })
    }
  },
}))
