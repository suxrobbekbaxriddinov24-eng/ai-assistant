import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { UpgradeModal } from '../components/shared/UpgradeModal'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const DANGEROUS_KEYWORDS = ['delete', 'remove', 'send', 'submit', 'purchase', 'buy', 'pay', 'transfer', 'clear', 'format']

export default function Screen() {
  const { hasFeature } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [goal, setGoal] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [status, setStatus] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const sessionRef = useRef(null)
  const stopRef = useRef(false)
  const stepsFeedRef = useRef(null)

  const addStep = useCallback((text, type = 'info') => {
    setSteps(prev => {
      const next = [...prev, { id: Date.now(), text, type }]
      setTimeout(() => stepsFeedRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50)
      return next
    })
  }, [])

  const runLoop = useCallback(async (goalText) => {
    stopRef.current = false
    setRunning(true)
    setSteps([])
    sessionRef.current = null

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not logged in')

      addStep(`Goal: ${goalText}`, 'goal')
      let stepCount = 0
      const previousActions = []

      while (!stopRef.current && stepCount < 20) {
        setStatus('Capturing screen...')
        const screenshot = await window.electronAPI.captureScreen()

        setStatus('Thinking...')
        const res = await fetch(`${API_URL}/screen/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            goal: goalText,
            screenshot_base64: screenshot,
            session_id: sessionRef.current,
            previous_actions: previousActions
          })
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || 'Backend error')
        }

        const result = await res.json()
        sessionRef.current = result.session_id
        const action = result.action

        addStep(action.message || action.description || `Step ${stepCount + 1}`, 'step')

        if (result.is_complete || action.action === 'done') {
          addStep('Goal completed!', 'success')
          break
        }

        // Dangerous action — ask confirmation
        if (result.needs_confirmation) {
          setStatus('Waiting for confirmation...')
          await new Promise((resolve, reject) => {
            setPendingAction({
              action,
              onConfirm: () => { setPendingAction(null); resolve() },
              onCancel: () => { setPendingAction(null); reject(new Error('Cancelled by user')) }
            })
          })
        }

        if (stopRef.current) break

        // Execute action
        if (action.action !== 'screenshot' && action.action !== 'done') {
          setStatus(`Executing: ${action.description || action.action}`)
          const execResult = await window.electronAPI.executeAction(action)
          if (!execResult.success) {
            addStep(`Action failed: ${execResult.error}`, 'error')
            break
          }
        }

        previousActions.push(action)
        stepCount++

        // Small delay between steps
        await new Promise(r => setTimeout(r, 800))
      }

      if (stepCount >= 20) addStep('Reached step limit (20). Stopped.', 'warn')
    } catch (err) {
      addStep(`Error: ${err.message}`, 'error')
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [addStep])

  const handleStart = (e) => {
    e.preventDefault()
    if (!goal.trim()) return
    runLoop(goal.trim())
  }

  const handleStop = () => {
    stopRef.current = true
    setStatus('Stopping...')
  }

  // Not Pro+ — show upgrade gate
  if (!hasFeature('has_screen_control')) {
    return (
      <>
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🖥️</div>
            <h2 className="text-xl font-bold mb-2">Screen Control</h2>
            <p className="text-gray-400 text-sm mb-6">
              AI sees your screen and controls mouse & keyboard to complete tasks. Available on Pro and above.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Upgrade to Pro
            </button>
            <div className="mt-4">
              <Link to="/" className="text-sm text-gray-500 hover:text-white">← Back</Link>
            </div>
          </div>
        </div>
        <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} requiredTier="pro" featureName="Screen Control" />
      </>
    )
  }

  // Web version — desktop only feature
  if (!isElectron) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🖥️</div>
          <h2 className="text-xl font-bold mb-2">Desktop Only</h2>
          <p className="text-gray-400 text-sm mb-6">
            Screen Control requires the desktop app to capture and control your screen.
          </p>
          <a
            href="/download"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block"
          >
            Download Desktop App
          </a>
          <div className="mt-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-white">← Back</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
        <Link to="/" className="text-gray-400 hover:text-white text-sm">←</Link>
        <div>
          <h1 className="text-base font-bold">Screen Control</h1>
          <p className="text-xs text-gray-500">AI controls your mouse & keyboard</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {running && (
            <>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">{status || 'Running'}</span>
            </>
          )}
        </div>
      </div>

      {/* Goal input */}
      <div className="px-5 py-4 border-b border-gray-800">
        <form onSubmit={handleStart} className="flex gap-3">
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder='Tell the AI what to do… e.g. "Open Chrome and search for Bitcoin price"'
            disabled={running}
            className="flex-1 bg-gray-900 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          {!running ? (
            <button
              type="submit"
              disabled={!goal.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Stop
            </button>
          )}
        </form>
      </div>

      {/* Steps feed */}
      <div
        ref={stepsFeedRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
      >
        {steps.length === 0 && !running && (
          <div className="text-center text-gray-600 text-sm mt-20">
            <div className="text-4xl mb-3">🖥️</div>
            <p>Enter a goal above and the AI will control your screen to accomplish it.</p>
            <p className="mt-2 text-xs">Examples: "Open Notepad and write a shopping list" · "Search Google for weather"</p>
          </div>
        )}
        {steps.map(step => (
          <div
            key={step.id}
            className={`flex items-start gap-2 text-sm rounded-xl px-3 py-2 ${
              step.type === 'goal' ? 'bg-purple-900/30 text-purple-300' :
              step.type === 'success' ? 'bg-green-900/30 text-green-300' :
              step.type === 'error' ? 'bg-red-900/30 text-red-300' :
              step.type === 'warn' ? 'bg-yellow-900/30 text-yellow-300' :
              'bg-gray-900 text-gray-300'
            }`}
          >
            <span className="flex-shrink-0 mt-0.5">
              {step.type === 'goal' ? '🎯' :
               step.type === 'success' ? '✅' :
               step.type === 'error' ? '❌' :
               step.type === 'warn' ? '⚠️' : '▶'}
            </span>
            {step.text}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-sm text-gray-500 px-3">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            {status}
          </div>
        )}
      </div>

      {/* Confirmation modal for dangerous actions */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 border border-yellow-500/50 rounded-2xl p-6 max-w-sm w-full">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="text-white font-bold text-center mb-2">Confirm Action</h3>
            <p className="text-gray-300 text-sm text-center mb-1">The AI wants to:</p>
            <p className="text-yellow-300 text-sm text-center mb-6 font-medium">
              {pendingAction.action.description || pendingAction.action.action}
            </p>
            <div className="flex gap-3">
              <button
                onClick={pendingAction.onCancel}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={pendingAction.onConfirm}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
