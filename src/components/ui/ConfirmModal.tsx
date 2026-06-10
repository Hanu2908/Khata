import React from 'react'
import { Modal } from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  summary: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  confirmVariant?: 'destructive' | 'primary' | 'positive'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  summary,
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  confirmVariant = 'destructive',
}) => {
  const modalVariant = 
    confirmVariant === 'destructive' 
      ? 'danger' 
      : confirmVariant === 'positive' 
        ? 'positive' 
        : 'primary'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      isConfirmLoading={isLoading}
      variant={modalVariant}
    >
      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-medium text-text-primary">{summary}</p>
        {description && (
          <p className="text-[12px] text-text-tertiary">{description}</p>
        )}
      </div>
    </Modal>
  )
}
