import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

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
import Landing from '@/pages/Landing'
import { AppLayout } from '@/components/layout/AppLayout'

export default function App() {
  const isDark = useUIStore((s) => s.isDark)

  // Sync dark class on mount and change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <div className="min-h-dvh bg-bg text-text-primary">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/s/:token" element={<Share />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected Routes (wrapped in AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/person/:id" element={<Person />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
