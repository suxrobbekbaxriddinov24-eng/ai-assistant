import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { MessageBubble } from '../components/chat/MessageBubble'
import { StreamingText } from '../components/chat/StreamingText'
import { InputBar } from '../components/chat/InputBar'
import { TierBadge } from '../components/shared/TierBadge'
import TitleBar from '../components/TitleBar'

export default function Chat() {
  const {
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
  } = useChat()

  const { profile, signOut } = useAuth()
  const { requestsLeft } = useSubscription()
  const messagesEndRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadConversations()
  }, [])

  // Electron keyboard shortcuts
  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.on('shortcut:new-chat', startNewChat)
    window.electronAPI.on('shortcut:settings', () => navigate('/settings'))
    return () => {
      window.electronAPI.off('shortcut:new-chat', startNewChat)
      window.electronAPI.off('shortcut:settings', () => navigate('/settings'))
    }
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
    }
  }, [activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleSelectConversation = (id) => {
    setActiveConversation(id)
    loadMessages(id)
  }

  const left = requestsLeft()
  const isNearLimit = left !== Infinity && left <= 3

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* User info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.display_name || profile?.email}</p>
                <TierBadge tier={profile?.tier} />
              </div>
            </div>
            {isNearLimit && (
              <p className="text-xs text-yellow-400 mt-2">⚠ {left} request{left !== 1 ? 's' : ''} left today</p>
            )}
          </div>

          {/* New chat button */}
          <div className="p-3 border-b border-gray-800">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-sm"
            >
              <span>+</span> New Chat
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-600 text-center mt-4">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors mb-1 ${
                    activeConversationId === conv.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-400'
                  }`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <span className="text-xs flex-1 truncate">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom links */}
          <div className="p-3 border-t border-gray-800 space-y-1">
            <a href="/voice" className="block text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              🎙 Voice
            </a>
            <a href="/screen" className="block text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              🖥️ Screen Control
            </a>
            <a href="/agent" className="block text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              🤖 Agent
            </a>
            <a href="/billing" className="block text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              💳 Upgrade Plan
            </a>
            <a href="/settings" className="block text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              ⚙ Settings
            </a>
            <button onClick={signOut} className="w-full text-left text-xs text-gray-500 hover:text-red-400 px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              ← Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-gray-800 bg-gray-900 gap-3">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ☰
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-medium">Humanoid</p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 flex items-center justify-center text-white text-2xl font-bold">
                AI
              </div>
              <h2 className="text-xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                I can answer questions, help with writing, code, research, and much more.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm">
                {[
                  'Write a Python script to...',
                  'Explain how to...',
                  'Help me draft an email about...',
                  'What is the best way to...'
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="text-xs text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors border border-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id || msg.created_at} message={msg} />
              ))}
              {isStreaming && <StreamingText text={streamingText} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <InputBar onSend={sendMessage} disabled={isStreaming} />
      </div>
      </div>
    </div>
  )
}
