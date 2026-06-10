import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

  // Handle backdrop click (desktop/modal)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Sheet/Modal Container */}
          <motion.div
            ref={contentRef}
            initial={{ y: '100%', scale: 1 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 1 }}
            // Apply spring transition on mobile, scale animation on desktop (handled responsively or using variant mappings)
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0 }}
            dragElastic={{ bottom: 0.6, top: 0 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose()
              }
            }}
            className="relative w-full lg:max-w-[480px] bg-bg border-t lg:border border-border rounded-t-hero lg:rounded-hero shadow-card flex flex-col max-h-[85vh] lg:max-h-[90vh] z-10 select-none"
          >
            {/* Drag Handle for mobile */}
            <div className="flex justify-center py-2.5 cursor-grab lg:hidden active:cursor-grabbing">
              <div className="w-10 h-1 bg-text-tertiary/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between border-b border-divider pt-4 lg:pt-4">
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-10 lg:pb-6 select-text">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
