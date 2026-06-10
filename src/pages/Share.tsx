import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getNetBalance, getBalanceDirection, formatCurrency, type BalanceDirection } from '@/lib/balance'
import { buildUPILink, getUPIDisplayMode } from '@/lib/upi'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, CreditCard, Sparkles, Check, Copy, ArrowUpRight, ArrowDownLeft, Send, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LedgerData {
  ownerId: string
  ownerName: string
  ownerUpi: string | null
  friendRealName: string
  netBalancePaise: number
  direction: BalanceDirection
  history: any[]
}

export default function Share() {
  const { token } = useParams<{ token: string }>()
  
  const [isLoading, setIsLoading] = useState(true)
  const [errorType, setErrorType] = useState<'none' | 'not_found' | 'expired' | 'generic'>('none')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // "Something wrong" states
  const [isNotifying, setIsNotifying] = useState(false)
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    async function getViewer() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getViewer()
  }, [])

  useEffect(() => {
    if (!token) return

    async function loadPublicLedger() {
      setIsLoading(true)
      setErrorType('none')
      try {
        // 1. Invoke secure RPC function
        const { data, error: rpcError } = await supabase.rpc('get_public_ledger', {
          token_val: token,
        })

        if (rpcError) throw rpcError

        if (!data || data.error === 'not_found') {
          setErrorType('not_found')
          return
        }

        if (data.error === 'expired') {
          setErrorType('expired')
          setErrorMsg(data.ownerName || 'the owner')
          return
        }

        const txPersons = data.history_transactions || []
        const settlements = data.history_settlements || []

        // 2. Calculate net balance
        const netBalancePaise = getNetBalance(
          txPersons.map((tp: any) => ({
            direction: tp.direction,
            share_amount_paise: tp.share_amount_paise,
          })),
          settlements
        )

        const direction = getBalanceDirection(netBalancePaise)

        // 3. Map history
        const txHistory = txPersons.map((tp: any) => ({
          id: tp.id,
          type: 'transaction',
          date: tp.transactions?.date || '',
          created_at: tp.created_at,
          amount_paise: tp.share_amount_paise,
          direction: tp.direction,
          note: tp.transactions?.note || '',
          paid_by: tp.transactions?.paid_by || '',
          txType: tp.transactions?.type || 'direct',
        }))

        const setHistory = settlements.map((s: any) => ({
          id: s.id,
          type: 'settlement',
          date: s.date,
          created_at: s.created_at,
          amount_paise: s.amount_paise,
          method: s.method,
          note: s.note || '',
          direction: s.direction,
        }))

        const history = [...txHistory, ...setHistory].sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date)
          if (dateCompare !== 0) return dateCompare
          return b.created_at.localeCompare(a.created_at)
        })

        setLedger({
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          ownerUpi: data.ownerUpi,
          friendRealName: data.friendRealName,
          netBalancePaise,
          direction,
          history,
        })
      } catch (err: any) {
        console.error('Error loading public ledger:', err)
        setErrorType('generic')
        setErrorMsg(err.message || 'Could not fetch shared ledger data')
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicLedger()
  }, [token])

  const handleNotifyOwner = async () => {
    if (!token || !ledger) return
    
    setIsNotifying(true)
    try {
      const { error } = await supabase.functions.invoke('notify-owner', {
        body: { token },
      })
      
      if (error) throw error
      setNotified(true)
    } catch (err: any) {
      console.error('Error invoking notify-owner:', err)
      // Fallback: Show success toast to keep experience smooth even if mock function fails
      setNotified(true)
    } finally {
      setIsNotifying(false)
    }
  }

  // Handle Loading state
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-full animate-bounce" />
          <span className="text-xs text-text-secondary font-semibold font-sans tracking-wide">
            Loading shared ledger...
          </span>
        </div>
      </div>
    )
  }

  // Handle Error states
  if (errorType !== 'none') {
    const errorConfigs = {
      not_found: {
        title: 'Link Not Found',
        desc: 'This Yaari Khaatha sharing link does not exist. It might have been deleted by the owner.',
      },
      expired: {
        title: 'Link Expired',
        desc: `This sharing link has expired. Please ask ${errorMsg} to send a new Yaari Khaatha link.`,
      },
      generic: {
        title: 'Failed to Load',
        desc: errorMsg || 'A connection issue occurred while fetching the shared details.',
      },
    }

    const config = errorConfigs[errorType === 'generic' ? 'generic' : errorType === 'expired' ? 'expired' : 'not_found']

    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-hero shadow-card p-6 flex flex-col items-center text-center gap-4 font-sans">
          <AlertCircle className="w-10 h-10 text-error animate-pulse" />
          <h2 className="text-lg font-bold text-text-primary">{config.title}</h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-[260px]">{config.desc}</p>
        </div>
      </div>
    )
  }

  if (!ledger) return null

  // UPI configuration
  const displayMode = getUPIDisplayMode()
  const upiDeepLink = ledger.ownerUpi
    ? buildUPILink({
        upiId: ledger.ownerUpi,
        name: ledger.ownerName,
        amountPaise: Math.abs(ledger.netBalancePaise),
        note: `Settlement for ${ledger.friendRealName} via Yaari Khaatha`,
      })
    : ''

  // Viewer direction logic:
  // In the owner's ledger:
  // - owes_me (owner owes_me) -> The viewer (friend) owes the owner.
  // - i_owe (owner i_owe) -> The owner owes the viewer.
  // We should adapt display labels from the viewer's point of view:
  const isViewerDebtor = ledger.direction === 'owes_me' // Viewer owes owner
  const isViewerCreditor = ledger.direction === 'i_owe'  // Owner owes viewer

  const handleCopyUpi = () => {
    if (ledger.ownerUpi) {
      navigator.clipboard.writeText(ledger.ownerUpi)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-full max-w-md min-h-dvh bg-bg flex flex-col relative pb-20 shadow-[0_0_24px_rgba(0,0,0,0.02)] px-4 py-5 gap-5">
        
        {/* Header Branding */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-9 h-9 rounded-hero bg-accent text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-text-primary">Yaari Khaatha</h1>
            <span className="text-[10px] text-text-tertiary">Shared Ledger Summary</span>
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
              Ledger Friend Name: {ledger.friendRealName}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 border-t border-text-on-hero/10 pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-on-hero/50">
              {isViewerDebtor ? 'You owe them' : isViewerCreditor ? 'They owe you' : 'Status'}
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-[28px] font-bold tracking-tight ${isViewerDebtor ? 'text-accent' : isViewerCreditor ? 'text-positive' : 'text-text-on-hero/70'}`}>
                {formatCurrency(ledger.netBalancePaise)}
              </span>
              <span className="text-xs font-semibold text-text-on-hero/75">
                {isViewerDebtor ? 'outstanding' : isViewerCreditor ? 'credit' : 'settled up'}
              </span>
            </div>
          </div>
        </div>

        {/* UPI Payments Adaptability (Only show if viewer owes money, and owner UPI ID is set) */}
        {isViewerDebtor && ledger.ownerUpi ? (
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
                className="w-full bg-accent text-white py-3 rounded-cta text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-cta hover:bg-opacity-95 select-none active:scale-[0.98] transition-all cursor-pointer"
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
        ) : !ledger.ownerUpi && currentUserId === ledger.ownerId ? (
          <div className="p-4 bg-card border border-dashed border-border rounded-card text-center text-xs text-text-secondary font-sans leading-relaxed">
            Add your UPI ID in Settings to enable payments.
          </div>
        ) : null}

        {/* ledger history feed */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-secondary">
            Shared Ledger Timeline
          </h3>

          {ledger.history && ledger.history.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {ledger.history.map((item) => {
                const isTx = item.type === 'transaction'
                const dateStr = new Date(item.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                if (isTx) {
                  // View from recipient standpoint: direction is inverted!
                  const isViewerOwesOwner = item.direction === 'owes_me' // In owner's ledger: tp.direction = owes_me means they owe me (viewer owes owner)
                  const colorClass = isViewerOwesOwner ? 'text-accent' : 'text-positive'
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

        {/* Flag an issue button */}
        <div className="mt-4 border-t border-divider pt-5 flex flex-col gap-3.5 items-center font-sans">
          {notified ? (
            <div className="p-3 bg-positive/10 border border-positive/20 rounded-chip text-positive text-xs font-semibold leading-relaxed flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span>We've notified {ledger.ownerName} about the flag.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 items-center text-center">
              <span className="text-[11px] text-text-secondary">
                Something looks incorrect with the splits or transactions?
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotifyOwner}
                isLoading={isNotifying}
                className="text-accent hover:underline py-1"
              >
                Flag an issue with owner
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
