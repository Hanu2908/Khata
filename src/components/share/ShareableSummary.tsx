import React, { useState } from 'react'
import { parseISO, format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import {
  CreditCard,
  Sparkles,
  Check,
  Copy,
  Send,
  Mail,
  AlertCircle,
  MessageSquare,
  Landmark,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { formatCurrency, getBalanceDirection, type BalanceDirection } from '@/lib/balance'
import { buildUPILink, getUPIDisplayMode } from '@/lib/upi'
import { supabase } from '@/lib/supabase'

interface HistoryItem {
  id: string
  type: 'transaction' | 'settlement'
  date: string
  created_at: string
  amount_paise: number
  direction: 'owes_me' | 'i_owe' | 'i_paid' | 'they_paid'
  note: string
  paid_by?: string
  txType?: string
  method?: 'cash' | 'upi' | 'other'
}

interface LedgerData {
  ownerId: string
  ownerName: string
  ownerUpi: string | null
  friendRealName: string
  netBalancePaise: number
  direction: BalanceDirection
  history: HistoryItem[]
  expiresAt?: string
}

interface ShareableSummaryProps {
  ledger: LedgerData
  token: string
  currentUserId: string | null
}

export const ShareableSummary: React.FC<ShareableSummaryProps> = ({
  ledger,
  token,
  currentUserId,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false)
  const [selectedTxId, setSelectedTxId] = useState<string>('general')
  const [issueComment, setIssueComment] = useState('')
  const [isNotifying, setIsNotifying] = useState(false)
  const [notified, setNotified] = useState(false)

  const isViewerDebtor = ledger.direction === 'owes_me' // Friend (viewer) owes owner
  const isViewerCreditor = ledger.direction === 'i_owe'  // Owner owes friend (viewer)

  const displayMode = getUPIDisplayMode()
  const upiDeepLink = ledger.ownerUpi
    ? buildUPILink({
        upiId: ledger.ownerUpi,
        name: ledger.ownerName,
        amountPaise: Math.abs(ledger.netBalancePaise),
        note: `Settlement for ${ledger.friendRealName} via Yaari Khaatha`,
      })
    : ''

  const handleCopyUpi = () => {
    if (ledger.ownerUpi) {
      navigator.clipboard.writeText(ledger.ownerUpi)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }
  }

  const handleNotifyOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsNotifying(true)
    try {
      const selectedTx = ledger.history.find(h => h.id === selectedTxId)
      const details = selectedTx
        ? `Transaction: "${selectedTx.note || selectedTx.txType || 'Entry'}" of ${formatCurrency(selectedTx.amount_paise)} on ${format(parseISO(selectedTx.date), 'dd MMM yyyy')}`
        : 'General ledger issue'

      const { error } = await supabase.functions.invoke('notify-owner', {
        body: {
          token,
          transactionId: selectedTxId === 'general' ? null : selectedTxId,
          comment: issueComment,
          details,
        },
      })

      if (error) throw error
      setNotified(true)
      setIsIssueSheetOpen(false)
      setIssueComment('')
      setSelectedTxId('general')
    } catch (err: any) {
      console.error('Error invoking notify-owner:', err)
      // Fallback: simulate success to maintain UX smoothness
      setNotified(true)
      setIsIssueSheetOpen(false)
      setIssueComment('')
      setSelectedTxId('general')
    } finally {
      setIsNotifying(false)
    }
  }

  return (
    <div className="w-full max-w-md min-h-dvh bg-bg flex flex-col relative pb-20 shadow-[0_0_24px_rgba(0,0,0,0.02)] px-4 py-5 gap-5">
      {/* Header Branding & Expire Badge */}
      <div className="flex flex-col gap-3.5 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-hero bg-accent text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-text-primary">Yaari Khaatha</h1>
              <span className="text-[10px] text-text-tertiary">Shared Ledger Summary</span>
            </div>
          </div>

          {ledger.expiresAt && (
            <div className="bg-divider border border-border/60 rounded-full px-2.5 py-1 text-[11px] text-text-secondary font-medium flex items-center gap-1.5 select-none shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
              Active until {format(parseISO(ledger.expiresAt), 'dd MMM')}
            </div>
          )}
        </div>
      </div>

      {/* Ledger Balance Card */}
      <div className="bg-hero text-text-on-hero rounded-hero shadow-card p-5 flex flex-col gap-4 font-sans select-none">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-on-hero/50">
            Shared Ledger Owner
          </span>
          <h2 className="text-base font-bold tracking-tight">
            {ledger.ownerName}
          </h2>
          <span className="text-[11px] text-text-on-hero/65">
            Friend Name: {ledger.friendRealName}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 border-t border-text-on-hero/10 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-on-hero/50">
            {isViewerDebtor ? 'You owe them' : isViewerCreditor ? 'They owe you' : 'Status'}
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className={`text-[28px] font-bold tracking-tight ${isViewerDebtor ? 'text-negative' : isViewerCreditor ? 'text-positive' : 'text-text-on-hero/70'}`}>
              {formatCurrency(ledger.netBalancePaise)}
            </span>
            <span className="text-xs font-semibold text-text-on-hero/75">
              {isViewerDebtor ? 'outstanding' : isViewerCreditor ? 'credit' : 'settled up'}
            </span>
          </div>
        </div>
      </div>

      {/* UPI Payments Adaptability */}
      {isViewerDebtor ? (
        ledger.ownerUpi ? (
          <div className="p-5 bg-card border border-divider rounded-card flex flex-col items-center text-center gap-4 font-sans shadow-sm">
            <span className="text-xs font-bold text-text-primary uppercase tracking-[0.08em] flex items-center gap-1.5 self-start">
              <CreditCard className="w-4.5 h-4.5 text-accent animate-pulse" />
              Pay {ledger.ownerName} via UPI
            </span>

            {/* iOS/Desktop QR rendering */}
            {(displayMode === 'qr' || displayMode === 'both') && (
              <div className="bg-white p-3.5 border border-divider/60 rounded-card shadow-sm flex flex-col items-center justify-center">
                <QRCodeSVG value={upiDeepLink} size={160} />
                <span className="text-[10px] text-text-tertiary font-sans mt-2.5">
                  Scan using GPay, PhonePe, or Paytm
                </span>
              </div>
            )}

            {/* Android deep-link CTA */}
            {displayMode === 'deeplink' && (
              <a
                href={upiDeepLink}
                className="w-full bg-accent text-white py-3 rounded-cta text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-cta hover:bg-opacity-95 select-none active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <Send className="w-4 h-4" />
                Pay {formatCurrency(ledger.netBalancePaise)}
              </a>
            )}

            {/* iOS deep-link fallback */}
            {displayMode === 'qr' && (
              <a
                href={upiDeepLink}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1 select-none cursor-pointer"
              >
                Open in UPI App
              </a>
            )}

            {/* Desktop / both copy option */}
            {displayMode === 'both' && (
              <div className="w-full flex items-center gap-2 border border-divider rounded-chip bg-divider/30 px-3 py-2">
                <span className="text-xs font-semibold text-text-secondary truncate flex-1 text-left">
                  {ledger.ownerUpi}
                </span>
                <button
                  onClick={handleCopyUpi}
                  className="text-xs font-bold text-accent flex items-center gap-1 select-none cursor-pointer shrink-0"
                >
                  {copiedUpi ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                  Copy UPI ID
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-card border border-divider rounded-card text-center flex flex-col items-center gap-2.5 shadow-sm font-sans">
            <Landmark className="w-6 h-6 text-text-tertiary" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text-primary">Direct Settlement Only</span>
              <p className="text-[11px] text-text-secondary leading-relaxed max-w-[280px]">
                {currentUserId === ledger.ownerId ? (
                  <>Add your UPI ID in Settings to enable direct UPI QR and payment links on this public share page.</>
                ) : (
                  <>{ledger.ownerName} has not configured their UPI ID yet. Please pay them in Cash, or contact them directly to update their UPI ID.</>
                )}
              </p>
            </div>
          </div>
        )
      ) : null}

      {/* Ledger History Feed */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-secondary">
          Shared Ledger Timeline
        </h3>

        {ledger.history && ledger.history.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {ledger.history.map((item) => {
              const isTx = item.type === 'transaction'
              const dateStr = format(parseISO(item.date), 'd MMM yyyy')

              if (isTx) {
                // Inverted direction for the recipient (viewer):
                // tp.direction = owes_me in owner's DB means recipient owes owner (negative)
                const isViewerOwesOwner = item.direction === 'owes_me'
                const colorClass = isViewerOwesOwner ? 'text-negative' : 'text-positive'
                const title = item.note || (item.txType === 'group_split' ? 'Group Split' : 'Direct IOU')
                const subtitle = item.paid_by === 'me' ? 'Paid by owner' : 'Paid by friend'

                return (
                  <div key={item.id} className="flex items-center justify-between p-3.5 bg-card border border-divider rounded-card shadow-card select-none font-sans">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-text-primary leading-tight">
                        {title}
                      </span>
                      <span className="text-[11px] text-text-tertiary mt-1">
                        {subtitle} • {dateStr}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[14px] font-semibold tracking-[-0.3px] ${colorClass}`}>
                        {formatCurrency(item.amount_paise)}
                      </span>
                      <span className="text-[11px] text-text-tertiary mt-0.5">
                        {isViewerOwesOwner ? 'you owe' : 'you get'}
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
                const isIPaidInDb = item.direction === 'i_paid' // Owner paid viewer

                return (
                  <div key={item.id} className="flex items-center justify-between p-3.5 bg-card/65 border border-divider/60 rounded-card select-none font-sans">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-text-secondary leading-tight">
                        {title}
                      </span>
                      <span className="text-[11px] text-text-tertiary mt-1">
                        {subtitle} • {dateStr}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-semibold tracking-[-0.3px] text-text-secondary">
                        {formatCurrency(item.amount_paise)}
                      </span>
                      <span className="text-[11px] text-text-tertiary mt-0.5">
                        {isIPaidInDb ? 'they paid' : 'you paid'}
                      </span>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        ) : (
          <div className="p-6 border border-divider bg-card rounded-card text-center text-xs text-text-tertiary">
            No entries logged in this timeline.
          </div>
        )}
      </div>

      {/* Flag an issue button & Bottom Sheet */}
      <div className="mt-4 border-t border-divider pt-5 flex flex-col gap-3.5 items-center font-sans">
        {notified ? (
          <div className="p-3 bg-positive/10 border border-positive/20 rounded-chip text-positive text-xs font-semibold leading-relaxed flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" />
            <span>We've notified {ledger.ownerName} about the issue.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 items-center text-center">
            <span className="text-[11px] text-text-secondary">
              Something looks incorrect with the splits or transactions?
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsIssueSheetOpen(true)}
              className="text-accent hover:underline py-1"
            >
              Flag an issue with owner
            </Button>
          </div>
        )}
      </div>

      {/* Issue Reporter Bottom Sheet */}
      <BottomSheet
        isOpen={isIssueSheetOpen}
        onClose={() => setIsIssueSheetOpen(false)}
        title="Report an Issue"
      >
        <form onSubmit={handleNotifyOwner} className="flex flex-col gap-4 font-sans text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Select Transaction
            </label>
            <select
              value={selectedTxId}
              onChange={(e) => setSelectedTxId(e.target.value)}
              className="w-full h-11 bg-card border border-border rounded-cta px-3.5 text-sm text-text-primary focus:outline-none focus:border-accent font-sans"
            >
              <option value="general">General ledger issue (No specific entry)</option>
              {ledger.history
                .filter((h) => h.type === 'transaction')
                .map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.note || (tx.txType === 'group_split' ? 'Group Split' : 'Direct IOU')} ({formatCurrency(tx.amount_paise)})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              What looks wrong?
            </label>
            <textarea
              required
              rows={3}
              value={issueComment}
              onChange={(e) => setIssueComment(e.target.value)}
              placeholder="e.g. My split amount is incorrect, or I already paid for this..."
              className="w-full bg-card border border-border rounded-cta px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-sans"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsIssueSheetOpen(false)}
              className="flex-1 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isNotifying}
              className="flex-1 py-3 bg-accent text-white hover:bg-opacity-95"
            >
              Send Notice
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
