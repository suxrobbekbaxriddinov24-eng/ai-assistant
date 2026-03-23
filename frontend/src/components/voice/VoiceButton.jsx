import { useVoice } from '../../hooks/useVoice'

export function VoiceButton({ onTranscript, size = 'lg' }) {
  const { isRecording, isProcessing, startRecording, stopRecording, transcribe } = useVoice()

  const handleClick = async () => {
    if (isRecording) {
      const blob = await stopRecording()
      if (blob) {
        const text = await transcribe(blob)
        if (text && onTranscript) onTranscript(text)
      }
    } else {
      await startRecording()
    }
  }

  const sizes = {
    sm: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl'
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center transition-all
        ${isRecording
          ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40 animate-pulse'
          : isProcessing
          ? 'bg-yellow-500/20 text-yellow-400 cursor-wait'
          : 'bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white hover:scale-105'
        }
      `}
      title={isRecording ? 'Stop recording' : isProcessing ? 'Transcribing...' : 'Start voice input'}
    >
      {isProcessing ? '⏳' : isRecording ? '⏹' : '🎤'}
    </button>
  )
}
