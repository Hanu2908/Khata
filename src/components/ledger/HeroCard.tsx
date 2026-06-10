import React from 'react'
import { formatCurrency } from '@/lib/balance'
import { ArrowUpRight, ArrowDownLeft, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeroCardProps {
  peopleOweMeTotal: number
  iOwePeopleTotal: number
  showUpiNudge?: boolean
  onDismissUpiNudge?: () => void
}

export const HeroCard: React.FC<HeroCardProps> = ({
  peopleOweMeTotal,
  iOwePeopleTotal,
  showUpiNudge,
  onDismissUpiNudge,
}) => {
  return (
    <div className="w-full bg-hero text-text-on-hero rounded-hero shadow-card p-5 flex flex-col gap-4">
      <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-on-hero/60">
        Ledger Summary
      </h2>
      
      <div className="grid grid-cols-2 divide-x divide-text-on-hero/10">
        {/* Left Column: People Owe Me */}
        <div className="flex flex-col gap-1 pr-3">
          <span className="text-[12px] font-medium text-text-on-hero/70 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-positive" />
            They owe you
          </span>
          <span className="text-[26px] font-semibold tracking-[-0.03em] text-positive font-sans">
            {formatCurrency(peopleOweMeTotal)}
          </span>
        </div>

        {/* Right Column: I Owe People */}
        <div className="flex flex-col gap-1 pl-4">
          <span className="text-[12px] font-medium text-text-on-hero/70 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-accent" />
            You owe
          </span>
          <span className="text-[26px] font-semibold tracking-[-0.03em] text-accent font-sans">
            {formatCurrency(iOwePeopleTotal)}
          </span>
        </div>
      </div>

      {showUpiNudge && (
        <div className="border-t border-text-on-hero/10 pt-3 mt-1 flex items-center justify-between text-[11px] font-sans">
          <Link
            to="/settings"
            className="text-accent hover:underline flex items-center gap-1 font-semibold text-left pr-2"
          >
            Add your UPI ID to let friends pay you directly →
          </Link>
          <button
            type="button"
            onClick={onDismissUpiNudge}
            className="text-text-on-hero/45 hover:text-text-on-hero/80 transition-colors p-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
