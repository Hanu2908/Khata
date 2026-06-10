import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, Plus, ClipboardList, Settings } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useBalance } from '@/hooks/useBalance'

export const BottomNav: React.FC = () => {
  const openSheet = useUIStore((s) => s.openSheet)
  const fabPulsed = useUIStore((s) => s.fabPulsed)
  const { balances, isLoading } = useBalance()

  const isEmpty = !isLoading && balances.length === 0
  const shouldPulse = !fabPulsed && isEmpty

  const activeClass = 'flex flex-col items-center justify-center flex-1 text-accent py-2 transition-colors'
  const inactiveClass = 'flex flex-col items-center justify-center flex-1 text-text-secondary hover:text-text-primary py-2 transition-colors'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-divider flex justify-center">
      <div className="w-full max-w-md h-16 flex items-center justify-between relative px-2">
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </NavLink>

        {/* Tab 2: Groups */}
        <NavLink
          to="/groups"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Groups</span>
        </NavLink>

        {/* Center: FAB Placeholder for alignment */}
        <div className="flex-1 flex justify-center relative -mt-6 h-16 w-16">
          <button
            onClick={() => openSheet('add-transaction')}
            className={`absolute -top-3 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-cta hover:bg-opacity-95 active:scale-95 transition-all duration-150 cursor-pointer z-50 border-4 border-card ${shouldPulse ? 'animate-fab-pulse' : ''}`}
            aria-label="Add transaction"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Tab 3: Activity */}
        <NavLink
          to="/activity"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <ClipboardList className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Activity</span>
        </NavLink>

        {/* Tab 4: Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Settings</span>
        </NavLink>
      </div>
    </div>
  )
}
