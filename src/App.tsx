import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/useUIStore'
import type { Session } from '@supabase/supabase-js'

// Import Pages
import Home from '@/pages/Home'
import Groups from '@/pages/Groups'
import Activity from '@/pages/Activity'
import Person from '@/pages/Person'
import AddTransaction from '@/pages/AddTransaction'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import Share from '@/pages/Share'

export default function App() {
  const isDark = useUIStore((s) => s.isDark)
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Sync dark class on mount and change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Subscribe to auth state changes
  useEffect(() => {
    let authSubscription: any

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        
        if (initialSession) {
          await checkOnboarding(initialSession.user.id)
        } else {
          setIsOnboarded(false)
          setIsAuthLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setIsAuthLoading(false)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession)
          if (currentSession) {
            await checkOnboarding(currentSession.user.id)
          } else {
            setIsOnboarded(false)
            setIsAuthLoading(false)
          }
        }
      )
      authSubscription = subscription
    }

    initAuth()

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  async function checkOnboarding(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      
      const onboarded = !!(profile && profile.name)
      setIsOnboarded(onboarded)
    } catch (err) {
      console.error('Onboarding check error:', err)
      setIsOnboarded(false)
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Handle Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-full animate-bounce" />
          <span className="text-xs text-text-secondary font-semibold font-sans tracking-wide">
            Loading Yaari Khaatha...
          </span>
        </div>
      </div>
    )
  }

  const isPublicRoute = location.pathname.startsWith('/s/')

  return (
    <div
      className="min-h-dvh"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <Routes>
        {/* Public Share Route (No login required) */}
        <Route path="/s/:token" element={<Share />} />

        {/* Auth Route */}
        <Route
          path="/login"
          element={session ? <Navigate to={isOnboarded ? '/' : '/onboarding'} replace /> : <Login />}
        />

        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : isOnboarded ? (
              <Navigate to="/" replace />
            ) : (
              <Onboarding />
            )
          }
        />

        {/* Private Routes Guarded by Auth & Onboarding */}
        <Route
          path="/"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Home />
            )
          }
        />

        <Route
          path="/groups"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Groups />
            )
          }
        />

        <Route
          path="/activity"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Activity />
            )
          }
        />

        <Route
          path="/person/:id"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Person />
            )
          }
        />

        <Route
          path="/add-transaction"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <AddTransaction />
            )
          }
        />

        <Route
          path="/settings"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Settings />
            )
          }
        />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
