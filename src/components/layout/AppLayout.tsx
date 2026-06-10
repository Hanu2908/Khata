import React, { useEffect, useState } from 'react'
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { FAB } from './FAB'
import { Toaster } from '@/components/ui/Toast'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useUIStore } from '@/store/useUIStore'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'

export const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeSheet = useUIStore((s) => s.activeSheet)
  const closeSheet = useUIStore((s) => s.closeSheet)

  const [session, setSession] = useState<any>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const { data: profile, isLoading: loadingProfile } = useProfile()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoadingSession(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoadingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loadingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wait for profile loading
  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    )
  }

  // Redirect to onboarding if profile doesn't exist or is not fully onboarded
  if ((!profile || !profile.onboarded) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  const isPersonPage = location.pathname.startsWith('/person/')

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar (lg and up) */}
      <div className="hidden lg:block w-60 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow lg:pl-0 w-full">
        <Outlet />
      </div>

      {/* Mobile Bottom Nav (less than lg) */}
      <BottomNav />

      {/* Mobile FAB (less than lg, hidden on person pages) */}
      <FAB hidden={isPersonPage} />

      {/* Global Toast Provider */}
      <Toaster />

      {/* Global Bottom Sheet for "Record Entry" selection */}
      <BottomSheet
        isOpen={activeSheet === 'add-transaction'}
        onClose={closeSheet}
        title="Record Entry"
      >
        <div className="flex flex-col gap-3 font-sans">
          <button
            onClick={() => {
              closeSheet()
              navigate('/add?type=direct')
            }}
            className="flex items-center gap-4 p-4 bg-card border border-divider hover:border-accent hover:bg-divider/20 rounded-card text-left transition-all select-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
              1:1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-text-primary text-sm leading-snug">Gave / Took Entry</h4>
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">Record a transaction with a single friend</p>
            </div>
          </button>

          <button
            onClick={() => {
              closeSheet()
              navigate('/add?type=group_split')
            }}
            className="flex items-center gap-4 p-4 bg-card border border-divider hover:border-accent hover:bg-divider/20 rounded-card text-left transition-all select-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-positive/10 text-positive flex items-center justify-center font-bold text-sm shrink-0">
              1:N
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-text-primary text-sm leading-snug">Group Split</h4>
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">Split an expense equally among multiple people</p>
            </div>
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
