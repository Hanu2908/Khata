import React from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Home, Users, ClipboardList, Settings, LogOut, Plus, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const openSheet = useUIStore((s) => s.openSheet)
  const { data: profile } = useProfile()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/login')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const sidebarLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/activity', label: 'Activity', icon: ClipboardList },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  const activeClass = 'flex items-center gap-3 px-4 py-3 bg-divider/40 text-accent font-semibold rounded-card transition-all select-none cursor-pointer border-l-4 border-accent'
  const inactiveClass = 'flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-divider/20 rounded-card transition-all select-none cursor-pointer border-l-4 border-transparent'

  return (
    <aside className="flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0 p-5 shrink-0 justify-between font-sans transition-colors duration-200">
      <div className="flex flex-col gap-8">
        {/* Logo & Branding */}
        <div className="flex items-center gap-2 px-2 select-none">
          <div className="w-9 h-9 rounded-hero bg-accent text-text-on-accent flex items-center justify-center shadow-cta">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Yaari Khaatha
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex flex-col gap-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              <span className="text-[14px]">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Add Expense CTA */}
        <button
          onClick={() => openSheet('add-transaction')}
          className="w-full py-3.5 bg-accent text-text-on-accent font-semibold rounded-cta shadow-cta hover:bg-opacity-95 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-semibold tracking-wide">Gave / Took Entry</span>
        </button>
      </div>

      {/* Sidebar User Profile Info & Logout */}
      {profile && (
        <div className="flex flex-col gap-4 border-t border-divider pt-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {profile.name 
                ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) 
                : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary text-sm truncate leading-tight">
                {profile.name}
              </h4>
              <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                {profile.upi_id || 'No UPI ID linked'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-error hover:text-error hover:bg-error/5 rounded-chip transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  )
}
