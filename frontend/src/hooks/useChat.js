import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { API_URL } from '../lib/api'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

export function useChat() {
  const {
    conversations, activeConversationId, messages, isStreaming, streamingText,
    setConversations, setActiveConversation, setMessages, addMessage,
    startStreaming, appendChunk, finishStreaming
  } = useChatStore()

  const { profile } = useAuthStore()

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations')
      setConversations(data)
    } catch (e) {
      console.error('Failed to load conversations', e)
    }
  }, [setConversations])

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`)
      setMessages(data)
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }, [setMessages])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return

    // Optimistically add user message
    addMessage({ role: 'user', content: text, id: Date.now() })
    startStreaming()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          conversation_id: activeConversationId,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let conversationId = activeConversationId

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'meta') {
              conversationId = data.conversation_id
              setActiveConversation(conversationId)
            } else if (data.type === 'chunk') {
              appendChunk(data.text)
            } else if (data.type === 'done') {
              finishStreaming()
              await loadConversations()
            }
          } catch (e) {
            // skip malformed lines
          }
        }
      }
    } catch (error) {
      finishStreaming()
      addMessage({
        role: 'assistant',
        content: `Error: ${error.message}`,
        id: Date.now(),
        isError: true
      })
    }
  }, [activeConversationId, isStreaming, addMessage, startStreaming, appendChunk, finishStreaming, setActiveConversation, loadConversations])

  const startNewChat = useCallback(() => {
    setActiveConversation(null)
    setMessages([])
  }, [setActiveConversation, setMessages])

  const deleteConversation = useCallback(async (conversationId) => {
    await api.delete(`/chat/conversations/${conversationId}`)
    await loadConversations()
    if (activeConversationId === conversationId) {
      startNewChat()
    }
  }, [activeConversationId, loadConversations, startNewChat])

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    streamingText,
    sendMessage,
    loadConversations,
    loadMessages,
    startNewChat,
    deleteConversation,
    setActiveConversation
  }
}
