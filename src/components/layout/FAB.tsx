import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useBalance } from '@/hooks/useBalance'

interface FABProps {
  hidden?: boolean
}

export const FAB: React.FC<FABProps> = ({ hidden = false }) => {
  const openSheet = useUIStore((s) => s.openSheet)
  const fabPulsed = useUIStore((s) => s.fabPulsed)
  const setFabPulsed = useUIStore((s) => s.setFabPulsed)
  const { balances, isLoading } = useBalance()

  if (hidden) return null

  const isEmpty = !isLoading && balances.length === 0
  const shouldPulse = !fabPulsed && isEmpty

  const handleClick = () => {
    openSheet('add-transaction')
    if (shouldPulse) {
      setFabPulsed(true)
    }
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 lg:hidden flex flex-col items-center">
      {/* Tooltip */}
      <AnimatePresence>
        {shouldPulse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-18 bg-hero text-text-on-hero text-[12px] font-medium px-3 py-1.5 rounded-chip shadow-md whitespace-nowrap mb-1"
          >
            Tap to add your first transaction!
            {/* Tooltip arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-hero rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className={`w-14 h-14 bg-accent text-text-on-accent rounded-full flex items-center justify-center shadow-cta hover:bg-opacity-95 cursor-pointer border-4 border-card relative ${
          shouldPulse ? 'animate-fab-pulse' : ''
        }`}
        aria-label="Add transaction"
      >
        <Plus className="w-7 h-7" />
      </motion.button>
    </div>
  )
}
