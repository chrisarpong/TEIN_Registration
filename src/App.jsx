import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import { GraduationCap } from 'lucide-react'

// Import Pages
import Registration from './pages/Registration'
import Verify from './pages/Verify'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

// Navigation Component (Visible on Public Pages Only)
const Navbar = () => {
  const location = useLocation();
  if (location.pathname.includes('admin')) return null; // Hide on Admin pages

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border-b border-white/5"></div>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">

        {/* Logo Area */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-none group-hover:text-tein-green transition-colors">TEIN-UCC</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Portal</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <Link
            to="/"
            className={`text-xs font-bold px-6 py-2.5 rounded-full transition-all duration-300 ${location.pathname === '/' ? 'bg-tein-green text-white shadow-lg shadow-tein-green/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  )
}

// Protected Route Component (Security Gatekeeper)
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-black font-mono text-xs tracking-widest animate-pulse">VERIFYING ACCESS...</div>
  if (!session) return <Navigate to="/admin" replace />

  return children
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Registration />} />
        <Route path="/verify/:id" element={<Verify />} />
        <Route path="/admin" element={<AdminLogin />} />

        {/* Protected Admin Routes (Locked) */}
        <Route
          path="/admin/dashboard/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App