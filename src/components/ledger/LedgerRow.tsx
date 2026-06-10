import React from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/balance'

interface LedgerRowProps {
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
  }
  runningBalance?: number | null
  onPress: (id: string, type: 'transaction' | 'settlement') => void
}

export const LedgerRow: React.FC<LedgerRowProps> = ({ item, runningBalance, onPress }) => {
  const isTx = item.type === 'transaction'

  // Option A color scheme: negative/debt is text-negative (steel-red), positive is text-positive
  if (isTx) {
    const isOwesMe = item.direction === 'owes_me'
    const colorClass = isOwesMe ? 'text-positive' : 'text-negative'
    const bgClass = isOwesMe ? 'bg-positive/10' : 'bg-negative/10'
    const Icon = isOwesMe ? ArrowUpRight : ArrowDownLeft
    const title = item.note || (item.txType === 'group_split' ? 'Group Split' : 'Direct Entry')
    const subtitle = item.paid_by === 'me' ? 'You paid' : 'They paid'

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onPress(item.id, 'transaction')}
        className="flex items-center justify-between p-3.5 bg-card border border-border rounded-card shadow-card select-none cursor-pointer transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-text-primary leading-tight truncate max-w-[180px] sm:max-w-[240px]">
              {title}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className={`text-[14px] font-bold tracking-[-0.3px] ${colorClass}`}>
            {formatCurrency(item.amount_paise)}
          </span>
          <span className="text-[10px] text-text-tertiary mt-0.5">
            {runningBalance !== undefined && runningBalance !== null 
              ? `Bal: ${formatCurrency(runningBalance)}` 
              : (isOwesMe ? 'owes you' : 'you owe')}
          </span>
        </div>
      </motion.div>
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
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onPress(item.id, 'settlement')}
        className="flex items-center justify-between p-3.5 bg-card/65 border border-border rounded-card select-none cursor-pointer transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-divider/60 text-text-secondary">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-text-secondary leading-tight truncate max-w-[180px] sm:max-w-[240px]">
              {title}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[14px] font-bold tracking-[-0.3px] text-text-secondary">
            {formatCurrency(item.amount_paise)}
          </span>
          <span className="text-[10px] text-text-tertiary mt-0.5">
            {runningBalance !== undefined && runningBalance !== null 
              ? `Bal: ${formatCurrency(runningBalance)}` 
              : (isIPaid ? 'you paid' : 'they paid')}
          </span>
        </div>
      </motion.div>
    )
  }
}
