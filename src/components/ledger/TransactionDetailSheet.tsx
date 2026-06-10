import React, { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/balance'
import { Calendar, Tag, Info, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import { parseISO, format } from 'date-fns'

interface TransactionDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    type: 'transaction' | 'settlement'
    date: string
    amount_paise: number
    note?: string | null
    direction?: 'owes_me' | 'i_owe' | 'i_paid' | 'they_paid'
    paid_by?: string
    txType?: 'direct' | 'group_split'
    method?: 'cash' | 'upi' | 'other'
  } | null
  runningBalance?: number | null
  onEdit?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  isOpen,
  onClose,
  item,
  runningBalance,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  if (!item) return null

  const isTx = item.type === 'transaction'
  const isOwesMe = item.direction === 'owes_me' || item.direction === 'they_paid'
  const directionColor = isOwesMe ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'
  const directionText = isTx
    ? (isOwesMe ? 'Rahul owes you' : 'You owe Rahul')
    : (isOwesMe ? 'They paid you back' : 'You paid them back')

  const formattedDate = format(parseISO(item.date), 'd MMMM yyyy')

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    setIsDeleteConfirmOpen(false)
    if (onDelete) onDelete()
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Entry Details">
        <div className="flex flex-col gap-6 font-sans">
          
          {/* Header detail */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
              {isTx 
                ? (item.txType === 'group_split' ? 'Group Split Entry' : 'Personal Entry') 
                : 'Settlement Entry'}
            </span>
            <span className="text-[32px] font-bold text-text-primary tracking-tight">
              {formatCurrency(item.amount_paise)}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold mt-1 flex items-center gap-1 ${directionColor}`}>
              {isOwesMe ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
              {directionText}
            </span>
          </div>

          {/* Details list */}
          <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-card">
            {/* Note */}
            <div className="flex items-start gap-3 text-xs leading-normal">
              <Tag className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-text-secondary">Note / Description</span>
                <span className="text-text-primary font-medium mt-0.5">
                  {item.note || (isTx ? 'No description' : 'Settle balance')}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 text-xs leading-normal border-t border-divider pt-3.5">
              <Calendar className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-text-secondary">Date of Entry</span>
                <span className="text-text-primary font-medium mt-0.5">{formattedDate}</span>
              </div>
            </div>

            {/* Running Balance */}
            {runningBalance !== undefined && runningBalance !== null && (
              <div className="flex items-start gap-3 text-xs leading-normal border-t border-divider pt-3.5">
                <Info className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-text-secondary">Running Balance After This</span>
                  <span className="text-text-primary font-semibold mt-0.5">
                    {formatCurrency(runningBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex gap-3 mt-2">
            {onEdit && (isTx ? item.txType !== 'group_split' : true) && (
              <Button
                variant="outline"
                fullWidth
                onClick={onEdit}
                className="flex items-center justify-center gap-2 border-border"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                fullWidth
                onClick={handleDelete}
                className="flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Reusable ConfirmModal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Entry"
        summary={`Are you sure you want to delete this ${formatCurrency(item.amount_paise)} entry?`}
        description="This will update the outstanding balance and cannot be undone."
        isLoading={isDeleting}
      />
    </>
  )
}
