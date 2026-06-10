import React from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, type BalanceDirection } from '@/lib/balance'
import { ChevronRight } from 'lucide-react'

interface PersonCardProps {
  personId: string
  name: string
  label: string | null
  netBalancePaise: number
  direction: BalanceDirection
}

export const PersonCard: React.FC<PersonCardProps> = ({
  personId,
  name,
  label,
  netBalancePaise,
  direction,
}) => {
  const displayName = label || name
  const hasLabel = !!label

  const directionConfig = {
    owes_me: {
      text: 'owes you',
      colorClass: 'text-positive',
    },
    i_owe: {
      text: 'you owe',
      colorClass: 'text-accent',
    },
    settled: {
      text: 'settled up',
      colorClass: 'text-text-tertiary',
    },
  }

  const currentConfig = directionConfig[direction]

  return (
    <Link
      to={`/person/${personId}`}
      className="flex items-center justify-between p-4 bg-card border border-divider hover:border-border rounded-card shadow-card transition-all duration-200 active:scale-[0.99] select-none"
    >
      <div className="flex items-center gap-3.5">
        <Avatar name={name} size="md" />
        
        <div className="flex flex-col">
          <span className="text-[16px] font-medium text-text-primary tracking-[-0.1px] leading-tight">
            {displayName}
          </span>
          {hasLabel && (
            <span className="text-[12px] text-text-tertiary font-sans mt-0.5">
              {name}
            </span>
          )}
          <span className={`text-[12px] font-medium ${currentConfig.colorClass} mt-0.5`}>
            {currentConfig.text}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {direction !== 'settled' && (
          <span className={`text-[15px] font-semibold tracking-[-0.3px] font-sans ${currentConfig.colorClass}`}>
            {formatCurrency(netBalancePaise)}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
      </div>
    </Link>
  )
}
