import { useState, useCallback } from 'react'
import { useVoice } from '../hooks/useVoice'
import { useChat } from '../hooks/useChat'
import { useSubscription } from '../hooks/useSubscription'
import { UpgradeModal } from '../components/shared/UpgradeModal'
import { AudioWave } from '../components/voice/AudioWave'
import { Link } from 'react-router-dom'

export default function Voice() {
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { isRecording, isProcessing, isPlaying, startRecording, stopRecording, transcribe, speak, stopSpeaking } = useVoice()
  const { sendMessage } = useChat()
  const { hasFeature } = useSubscription()

  const handleMicToggle = useCallback(async () => {
    if (!hasFeature('has_voice')) {
      setShowUpgrade(true)
      return
    }

    if (isRecording) {
      const blob = await stopRecording()
      if (!blob) return

      const text = await transcribe(blob)
      if (!text) return
      setTranscript(text)

      // Send to chat and get reply
      // For voice page, we use the non-streaming chat endpoint
      try {
        const { data: session } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/voice/chat`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: (() => {
              const fd = new FormData()
              fd.append('audio', blob, 'recording.webm')
              return fd
            })()
          }
        )
        if (!response.ok) throw new Error('Voice chat failed')
        const result = await response.json()
        setReply(result.reply)
        // Play the AI response audio
        const audioBytes = Uint8Array.from(atob(result.audio_base64), c => c.charCodeAt(0))
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audio.play()
      } catch (err) {
        setReply(`Error: ${err.message}`)
      }
    } else {
      setTranscript('')
      setReply('')
      await startRecording()
    }
  }, [isRecording, hasFeature, startRecording, stopRecording, transcribe])

  const phase = isRecording ? 'recording' : isProcessing ? 'processing' : isPlaying ? 'playing' : 'idle'

  const phaseConfig = {
    idle:       { label: 'Tap to speak', color: 'bg-gray-800 hover:bg-gray-700', size: 'w-24 h-24' },
    recording:  { label: 'Listening... tap to stop', color: 'bg-red-500 animate-pulse', size: 'w-24 h-24' },
    processing: { label: 'Thinking...', color: 'bg-yellow-500/20', size: 'w-24 h-24' },
    playing:    { label: 'Speaking...', color: 'bg-green-600', size: 'w-24 h-24' },
  }

  const cfg = phaseConfig[phase]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Back to Chat
        </Link>
        <h1 className="text-sm font-medium text-white">Voice Mode</h1>
        <div className="w-16" />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* AI avatar */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-all ${
          phase === 'idle' ? 'bg-gradient-to-br from-blue-500 to-purple-600'
          : phase === 'recording' ? 'bg-red-500'
          : phase === 'processing' ? 'bg-yellow-500'
          : 'bg-green-600'
        }`}>
          AI
        </div>

        {/* Audio wave */}
        <AudioWave active={isRecording || isPlaying} color={isRecording ? '#ef4444' : '#22c55e'} bars={9} />

        {/* Transcript */}
        <div className="w-full max-w-md min-h-16 text-center">
          {transcript && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">You said:</p>
              <p className="text-white text-sm">{transcript}</p>
            </div>
          )}
          {reply && (
            <div>
              <p className="text-xs text-gray-500 mb-1">AI replied:</p>
              <p className="text-gray-300 text-sm">{reply}</p>
            </div>
          )}
          {!transcript && !reply && (
            <p className="text-gray-600 text-sm">Start speaking and AI will respond</p>
          )}
        </div>

        {/* Mic button */}
        <button
          onClick={handleMicToggle}
          disabled={isProcessing}
          className={`${cfg.size} rounded-full text-white text-3xl flex items-center justify-center transition-all shadow-2xl ${cfg.color} disabled:opacity-50`}
        >
          {phase === 'idle' ? '🎤' : phase === 'recording' ? '⏹' : phase === 'processing' ? '⏳' : '🔊'}
        </button>

        <p className="text-sm text-gray-500">{cfg.label}</p>

        {isPlaying && (
          <button onClick={stopSpeaking} className="text-xs text-red-400 hover:text-red-300">
            Stop speaking
          </button>
        )}
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} requiredTier="plus" featureName="Voice Mode" />
    </div>
  )
}
