import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  isConfirmLoading?: boolean
  variant?: 'primary' | 'danger' | 'positive'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  isConfirmLoading = false,
  variant = 'primary',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-card border border-border rounded-card shadow-card flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <h3 className="text-base font-semibold text-text-primary tracking-[-0.1px]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-divider transition-colors duration-150 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-2 text-[13px] text-text-secondary leading-relaxed font-sans">
          {children}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 mt-2 bg-divider/30 border-t border-divider flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isConfirmLoading}>
            {cancelLabel}
          </Button>
          {onConfirm && confirmLabel && (
            <Button
              variant={variant === 'primary' ? 'primary' : variant === 'danger' ? 'danger' : 'positive'}
              size="sm"
              onClick={onConfirm}
              isLoading={isConfirmLoading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
