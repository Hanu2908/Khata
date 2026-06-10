import React from 'react'
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/balance'

interface HistoryItemProps {
  item: {
    id: string
    type: 'transaction' | 'settlement'
    date: string
    amount_paise: number
    note?: string | null
    direction?: 'owes_me' | 'i_owe' | 'i_paid' | 'they_paid'
    paid_by?: string                    // transaction only
    txType?: 'direct' | 'group_split'    // transaction only
    method?: 'cash' | 'upi' | 'other'   // settlement only
  }
}

export const TransactionItem: React.FC<HistoryItemProps> = ({ item }) => {
  const isTx = item.type === 'transaction'
  const dateStr = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (isTx) {
    const isOwesMe = item.direction === 'owes_me'
    const colorClass = isOwesMe ? 'text-positive' : 'text-accent'
    const Icon = isOwesMe ? ArrowUpRight : ArrowDownLeft
    const title = item.note || (item.txType === 'group_split' ? 'Group Split' : 'Direct IOU')
    const subtitle = item.paid_by === 'me' ? 'You paid' : 'They paid'

    return (
      <div className="flex items-center justify-between p-3.5 bg-card border border-divider rounded-card shadow-card select-none">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-divider/40 ${colorClass}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-text-primary leading-tight">
              {title}
            </span>
            <span className="text-[11px] text-text-tertiary mt-0.5">
              {subtitle} • {dateStr}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className={`text-[14px] font-semibold tracking-[-0.3px] font-sans ${colorClass}`}>
            {formatCurrency(item.amount_paise)}
          </span>
          <span className="text-[11px] text-text-tertiary mt-0.5">
            {isOwesMe ? 'owes you' : 'you owe'}
          </span>
        </div>
      </div>
    )
  } else {
    // Settlement
    const title = item.note || 'Settled up'
    const methodLabels = {
      cash: 'Cash payment',
      upi: 'UPI transfer',
      other: 'Other method',
    }
    const subtitle = methodLabels[item.method || 'cash']
    const isIPaid = item.direction === 'i_paid'

    return (
      <div className="flex items-center justify-between p-3.5 bg-card/65 border border-divider/60 rounded-card select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-divider/40 text-text-secondary">
            <CheckCircle2 className="w-4.5 h-4.5 text-text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-text-secondary leading-tight">
              {title}
            </span>
            <span className="text-[11px] text-text-tertiary mt-0.5">
              {subtitle} • {dateStr}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[14px] font-semibold tracking-[-0.3px] font-sans text-text-secondary">
            {formatCurrency(item.amount_paise)}
          </span>
          <span className="text-[11px] text-text-tertiary mt-0.5">
            {isIPaid ? 'you paid' : 'they paid'}
          </span>
        </div>
      </div>
    )
  }
}
