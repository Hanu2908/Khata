import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle clicking outside the sheet
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] transition-all duration-300 animate-fade-in"
    >
      <div
        ref={contentRef}
        className="w-full max-w-md bg-bg border-t border-border rounded-t-hero shadow-card flex flex-col max-h-[85vh] animate-slide-up"
      >
        {/* Handle for dragging feel */}
        <div className="flex justify-center py-2.5 cursor-grab">
          <div className="w-10 h-1 bg-text-tertiary/40 rounded-full" />
        </div>

        {/* Title and Close Button */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-divider">
          <h3 className="text-base font-semibold text-text-primary tracking-[-0.1px]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-divider transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-10">
          {children}
        </div>
      </div>
    </div>
  )
}
