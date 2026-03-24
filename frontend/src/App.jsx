import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import DesktopGate from './components/DesktopGate'
import Chat from './pages/Chat'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI
import Login from './pages/Login'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Download from './pages/Download'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Voice from './pages/Voice'
import Agent from './pages/Agent'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, profile } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (isElectron && profile?.tier === 'free') return <DesktopGate />
  return children
}

// Show Landing to guests, Chat to logged-in users
function HomeRoute() {
  const { isLoggedIn, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return isLoggedIn ? <Chat /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/download" element={<Download />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/voice" element={<ProtectedRoute><Voice /></ProtectedRoute>} />
        <Route path="/agent" element={<ProtectedRoute><Agent /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
