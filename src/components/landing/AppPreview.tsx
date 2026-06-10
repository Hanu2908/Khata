import React from 'react'
import { MessageSquare } from 'lucide-react'

export const AppPreview: React.FC = () => {
  return (
    <div className="w-full max-w-sm bg-card border border-border rounded-hero shadow-card p-6 relative overflow-hidden transition-all duration-200 font-sans">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-divider pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-text-primary">Live Preview</span>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
      </div>

      {/* Static App UI Preview Card */}
      <div className="flex flex-col gap-4 select-none">
        
        {/* Dashboard Total Card Mockup */}
        <div className="p-4 bg-hero rounded-hero text-text-on-hero flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-accent/20 rounded-full blur-2xl" />
          <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-on-hero/60">Active Balances</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold tracking-tight">₹1,240</span>
            <span className="text-xs text-positive font-semibold bg-positive/10 px-2 py-0.5 rounded-full">Net Owed to You</span>
          </div>
          <div className="border-t border-text-on-hero/10 pt-2 flex justify-between items-center text-[11px] text-text-on-hero/80">
            <span>Hostel Domino's split &amp; auto</span>
            <span>3 friends active</span>
          </div>
        </div>

        {/* Ledger Items Mockup */}
        <div className="flex flex-col gap-2">
          <div className="p-3 bg-bg/50 border border-divider rounded-card flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center text-xs font-bold">
                RS
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Rahul (Hostel)</h4>
                <p className="text-[10px] text-text-tertiary">Domino's Split</p>
              </div>
            </div>
            <span className="text-xs font-bold text-positive">₹320 owes you</span>
          </div>

          <div className="p-3 bg-bg/50 border border-divider rounded-card flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center text-xs font-bold">
                AP
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Ankit Patel</h4>
                <p className="text-[10px] text-text-tertiary">Chai + Samosa</p>
              </div>
            </div>
            <span className="text-xs font-bold text-negative">₹45 you owe</span>
          </div>
        </div>

        {/* WhatsApp Share Card mockup */}
        <div className="p-3 bg-green-500/5 dark:bg-green-500/10 border border-green-500/25 rounded-card flex items-center justify-between gap-3 mt-1">
          <div className="w-7 h-7 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-text-secondary leading-snug flex-1">
            "Hey! Settle up ₹320 with me on Yaari Khaatha: <span className="text-accent underline font-semibold">yk.in/s/xY3a</span>"
          </p>
        </div>
      </div>
    </div>
  )
}
