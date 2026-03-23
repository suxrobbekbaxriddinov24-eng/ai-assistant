import { useState, useRef, useCallback } from 'react'
import api from '../lib/api'

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(100) // collect data every 100ms
      setIsRecording(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Please allow microphone access to use voice features.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null)
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        resolve(blob)
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
    })
  }, [])

  const transcribe = useCallback(async (audioBlob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      const { data } = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data.text
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const speak = useCallback(async (text) => {
    try {
      const { data } = await api.post('/voice/synthesize', { text }, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const audio = new Audio(url)
      audioRef.current = audio
      setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
      await audio.play()
    } catch (error) {
      console.error('TTS failed:', error)
      setIsPlaying(false)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }, [])

  return {
    isRecording,
    isProcessing,
    isPlaying,
    startRecording,
    stopRecording,
    transcribe,
    speak,
    stopSpeaking
  }
}
