import { useState, useRef, useCallback } from 'react'
import { useVoice } from '../../hooks/useVoice'
import { useSubscription } from '../../hooks/useSubscription'
import { UpgradeModal } from '../shared/UpgradeModal'

export function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const textareaRef = useRef(null)
  const { isRecording, isProcessing, startRecording, stopRecording, transcribe } = useVoice()
  const { hasFeature } = useSubscription()

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, disabled, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleVoiceToggle = async () => {
    if (!hasFeature('has_voice')) {
      setShowUpgrade(true)
      return
    }
    if (isRecording) {
      const blob = await stopRecording()
      if (blob) {
        const transcribed = await transcribe(blob)
        if (transcribed) {
          setText(prev => prev + (prev ? ' ' : '') + transcribed)
        }
      }
    } else {
      await startRecording()
    }
  }

  return (
    <>
      <div className="border-t border-gray-700 p-4 bg-gray-900">
        <div className="flex items-end gap-3 bg-gray-800 rounded-2xl px-4 py-3 border border-gray-700 focus-within:border-blue-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message your AI assistant... (Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed max-h-48 min-h-[24px]"
          />

          {/* Voice button */}
          <button
            onClick={handleVoiceToggle}
            disabled={isProcessing}
            className={`p-2 rounded-xl transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : isProcessing
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isProcessing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Send message"
          >
            ➤
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          AI can make mistakes. Always verify important information.
        </p>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredTier="plus"
        featureName="Voice input"
      />
    </>
  )
}
