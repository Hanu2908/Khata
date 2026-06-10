import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useUIStore } from '@/store/useUIStore'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  onBackClick?: () => void
  showNav?: boolean
  rightAction?: React.ReactNode
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  showNav = true,
  rightAction,
}) => {
  const navigate = useNavigate()
  const activeSheet = useUIStore((s) => s.activeSheet)
  const closeSheet = useUIStore((s) => s.closeSheet)

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-text-primary flex flex-col items-center">
      <div className="w-full max-w-md min-h-dvh bg-bg flex flex-col relative pb-24 shadow-[0_0_24px_rgba(0,0,0,0.02)]">
        {/* Header (optional) */}
        {(title || showBackButton || rightAction) && (
          <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-[4px] border-b border-divider h-14 flex items-center px-4 shrink-0 justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-divider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              {title && (
                <h1 className="text-[16px] font-semibold text-text-primary tracking-[-0.1px]">
                  {title}
                </h1>
              )}
            </div>
            {rightAction && <div className="flex items-center">{rightAction}</div>}
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 px-4 py-4 flex flex-col overflow-x-hidden">
          {children}
        </main>

        {/* Bottom Nav Bar */}
        {showNav && <BottomNav />}

        {/* Global Bottom Sheet for Transaction Selection */}
        <BottomSheet
          isOpen={activeSheet === 'add-transaction'}
          onClose={closeSheet}
          title="Record Entry"
        >
          <div className="flex flex-col gap-3 font-sans">
            <button
              onClick={() => {
                closeSheet()
                navigate('/add-transaction?type=direct')
              }}
              className="flex items-center gap-4 p-4 bg-card border border-divider hover:border-accent hover:bg-divider/20 rounded-card text-left transition-all select-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                1:1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary text-sm leading-snug">Direct IOU</h4>
                <p className="text-xs text-text-secondary mt-0.5 leading-snug">Record a transaction with a single friend</p>
              </div>
            </button>

            <button
              onClick={() => {
                closeSheet()
                navigate('/add-transaction?type=group_split')
              }}
              className="flex items-center gap-4 p-4 bg-card border border-divider hover:border-accent hover:bg-divider/20 rounded-card text-left transition-all select-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-positive/10 text-positive flex items-center justify-center font-bold text-sm">
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
    </div>
  )
}
