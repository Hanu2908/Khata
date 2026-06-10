import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { usePersonLedger } from '@/hooks/useBalance'
import { useCreateSettlement } from '@/hooks/useSettlements'
import { useShareToken, useCreateShareToken, useDeleteShareToken } from '@/hooks/useShare'
import { TransactionItem } from '@/components/ledger/TransactionItem'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, isOverpayment } from '@/lib/balance'
import { buildShareURL, buildShareMessage, buildWhatsAppURL } from '@/lib/share'
import { Send, Share2, ShieldAlert, Sparkles, RefreshCw, AlertCircle, Copy, Check, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function Person() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) {
    return (
      <PageWrapper title="Not Found" showBackButton={true}>
        <div className="p-4 text-center">Contact ID is missing.</div>
      </PageWrapper>
    )
  }

  const { balance, history, isLoading, isError, error, refetch } = usePersonLedger(id)
  const { data: shareToken, isLoading: isTokenLoading } = useShareToken(id)
  
  const createSettlementMutation = useCreateSettlement()
  const createShareTokenMutation = useCreateShareToken()
  const deleteShareTokenMutation = useDeleteShareToken()

  // Settlement Sheet State
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleDirection, setSettleDirection] = useState<'i_paid' | 'they_paid'>('they_paid')
  const [settleMethod, setSettleMethod] = useState<'cash' | 'upi' | 'other'>('cash')
  const [settleNote, setSettleNote] = useState('')
  
  // Overpayment Warning Modal State
  const [isOverpaymentModalOpen, setIsOverpaymentModalOpen] = useState(false)
  const [pendingSettlementData, setPendingSettlementData] = useState<any>(null)

  // Share link success state
  const [copiedLink, setCopiedLink] = useState(false)

  if (isLoading) {
    return (
      <PageWrapper title="Loading Ledger" showBackButton={true}>
        <div className="animate-pulse flex flex-col gap-4 mt-4 font-sans">
          <div className="w-full h-32 bg-card rounded-card border border-divider" />
          <div className="w-32 h-4 bg-divider rounded mt-2" />
          <div className="flex gap-2.5">
            <div className="flex-1 h-12 bg-divider rounded-cta" />
            <div className="flex-1 h-12 bg-divider rounded-cta" />
          </div>
          <div className="w-full h-48 bg-card rounded-card border border-divider mt-4" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !balance) {
    return (
      <PageWrapper title="Error" showBackButton={true}>
        <div className="p-4 bg-error/10 border border-error/20 rounded-hero flex flex-col items-center gap-3 text-error text-center font-sans mt-4">
          <AlertCircle className="w-8 h-8" />
          <h4 className="font-semibold text-sm">Ledger failed to load</h4>
          <p className="text-xs text-text-secondary">{error?.message || 'Contact details could not be loaded.'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </PageWrapper>
    )
  }

  const isOwesMe = balance.direction === 'owes_me'
  const isSettled = balance.direction === 'settled'
  const textColors = {
    owes_me: 'text-positive',
    i_owe: 'text-accent',
    settled: 'text-text-tertiary',
  }
  const directionLabels = {
    owes_me: 'owes you',
    i_owe: 'you owe',
    settled: 'settled up',
  }

  const handleOpenSettle = () => {
    // Default to outstanding balance amount in rupees (absolute value)
    const amountRupees = Math.abs(balance.netBalancePaise) / 100
    setSettleAmount(isSettled ? '' : amountRupees.toString())
    setSettleMethod('cash')
    setSettleNote('')
    setSettleDirection(balance.direction === 'i_owe' ? 'i_paid' : 'they_paid')
    setIsSettleOpen(true)
  }

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountVal = parseFloat(settleAmount)
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid settlement amount')
      return
    }

    const amountPaise = Math.round(amountVal * 100)
    const isOver = isOverpayment(amountPaise, balance.netBalancePaise)

    const settlementParams = {
      person_id: id,
      amount_paise: amountPaise,
      direction: settleDirection,
      method: settleMethod,
      note: settleNote.trim() || null,
      date: new Date().toISOString().split('T')[0],
    }

    if (isOver) {
      // Trigger warning modal, wait for user confirmation
      setPendingSettlementData(settlementParams)
      setIsOverpaymentModalOpen(true)
    } else {
      await saveSettlement(settlementParams)
    }
  }

  const saveSettlement = async (params: any) => {
    try {
      await createSettlementMutation.mutateAsync(params)
      setIsSettleOpen(false)
      setIsOverpaymentModalOpen(false)
      setPendingSettlementData(null)
    } catch (err: any) {
      alert(err.message || 'Failed to save settlement')
    }
  }

  // Generate public link
  const handleGenerateLink = async () => {
    try {
      const tokenObj = await createShareTokenMutation.mutateAsync(id)
      const url = buildShareURL(tokenObj.token)
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err: any) {
      alert(err.message || 'Failed to create share link')
    }
  }

  // Revoke public link
  const handleRevokeLink = async () => {
    if (confirm('Are you sure you want to delete this share link? Anyone using the old link will lose access immediately.')) {
      await deleteShareTokenMutation.mutateAsync(id)
    }
  }

  // Copy current link
  const handleCopyLink = () => {
    if (shareToken) {
      const url = buildShareURL(shareToken.token)
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Share WhatsApp pre-filled text
  const handleWhatsAppShare = () => {
    if (shareToken) {
      const url = buildShareURL(shareToken.token)
      const msg = buildShareMessage(balance.netBalancePaise, url)
      const waUrl = buildWhatsAppURL(msg)
      window.open(waUrl, '_blank')
    }
  }

  const isExpired = shareToken ? new Date(shareToken.expires_at) < new Date() : false

  return (
    <PageWrapper title={balance.label || balance.name} showBackButton={true} showNav={true}>
      <div className="flex flex-col gap-5">
        
        {/* Contact Overview Panel */}
        <div className="bg-hero text-text-on-hero rounded-hero shadow-card p-5 flex flex-col gap-4 font-sans select-none">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-bold tracking-tight">
                {balance.label || balance.name}
              </h2>
              {balance.label && (
                <span className="text-[12px] text-text-on-hero/65 leading-none">
                  Real Name: {balance.name}
                </span>
              )}
            </div>
            {isOwesMe ? (
              <div className="w-9 h-9 rounded-full bg-positive/10 flex items-center justify-center text-positive">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            ) : isSettled ? (
              <div className="w-9 h-9 rounded-full bg-divider/10 flex items-center justify-center text-text-on-hero/50">
                <Check className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 border-t border-text-on-hero/10 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-on-hero/50">
              Net Balance
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-[30px] font-bold tracking-tight ${textColors[balance.direction]}`}>
                {formatCurrency(balance.netBalancePaise)}
              </span>
              <span className="text-sm font-semibold text-text-on-hero/75">
                {directionLabels[balance.direction]}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant={isOwesMe ? 'positive' : 'primary'}
            fullWidth
            onClick={handleOpenSettle}
            className="flex items-center gap-1.5"
          >
            <Send className="w-4.5 h-4.5" />
            Settle Up
          </Button>

          {shareToken && !isExpired ? (
            <Button
              variant="outline"
              fullWidth
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 border-border hover:bg-card"
            >
              <Share2 className="w-4.5 h-4.5 text-positive" />
              WhatsApp
            </Button>
          ) : (
            <Button
              variant="outline"
              fullWidth
              onClick={handleGenerateLink}
              isLoading={createShareTokenMutation.isPending}
              className="flex items-center gap-1.5 border-border hover:bg-card"
            >
              <Share2 className="w-4.5 h-4.5" />
              {shareToken && isExpired ? 'Renew Link' : 'Get Link'}
            </Button>
          )}
        </div>

        {/* Shared Link Control Section */}
        {shareToken && (
          <div className="p-4 bg-card border border-divider rounded-card flex flex-col gap-3 font-sans">
            {isExpired ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-error uppercase tracking-[0.08em] flex items-center gap-1.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-error animate-pulse" />
                    Share Link Expired
                  </span>
                  <button
                    onClick={handleRevokeLink}
                    className="text-text-tertiary hover:text-error transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Link
                  </button>
                </div>
                
                <p className="text-xs text-text-secondary leading-relaxed">
                  This link has expired and is no longer accessible to your friend. Click below to generate a new active link.
                </p>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateLink}
                  isLoading={createShareTokenMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New Link
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary uppercase tracking-[0.08em] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    Active Share Link
                  </span>
                  <button
                    onClick={handleRevokeLink}
                    className="text-text-tertiary hover:text-error transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke Link
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={buildShareURL(shareToken.token)}
                    className="w-full bg-divider/40 border border-border text-xs px-3 py-2 rounded-chip font-medium text-text-secondary outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-accent text-white rounded-chip hover:bg-opacity-95 select-none transition-all duration-150 cursor-pointer shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                  </button>
                </div>
                
                <span className="text-[10px] text-text-tertiary">
                  Link expires in 30 days. Shared links always display friend's real name ({balance.name}).
                </span>
              </>
            )}
          </div>
        )}

        {/* History Timeline */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-secondary">
            Ledger History
          </h3>

          {history && history.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {history.map((item) => (
                <TransactionItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-8 border border-divider bg-card rounded-card text-center text-xs text-text-secondary leading-relaxed">
              No transactions logged yet. Click Settle Up or use the + menu to make an entry.
            </div>
          )}
        </div>

      </div>

      {/* Settle Up Bottom Sheet */}
      <BottomSheet
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        title={`Settle Ledger with ${balance.label || balance.name}`}
      >
        <form onSubmit={handleSettleSubmit} className="flex flex-col gap-4 font-sans">
          
          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="₹0.00"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            prefixText="₹"
            required
            helperText={!isSettled ? `Outstanding: ${formatCurrency(balance.netBalancePaise)}` : ''}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Who Paid?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettleDirection('they_paid')}
                className={`
                  py-2.5 px-1 text-xs font-semibold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider truncate
                  ${settleDirection === 'they_paid' ? 'bg-accent text-white border-transparent shadow-sm' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                `}
              >
                {balance.label || balance.name} Paid Me
              </button>
              <button
                type="button"
                onClick={() => setSettleDirection('i_paid')}
                className={`
                  py-2.5 px-1 text-xs font-semibold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider truncate
                  ${settleDirection === 'i_paid' ? 'bg-accent text-white border-transparent shadow-sm' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                `}
              >
                I Paid {balance.label || balance.name}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'other'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSettleMethod(method)}
                  className={`
                    py-2.5 text-xs font-semibold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider
                    ${settleMethod === method ? 'bg-accent text-white border-transparent shadow-sm' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                  `}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Optional Note"
            type="text"
            placeholder="Cash handed over in canteen"
            value={settleNote}
            onChange={(e) => setSettleNote(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createSettlementMutation.isPending}
            className="mt-2"
          >
            Log Payment
          </Button>
        </form>
      </BottomSheet>

      {/* Overpayment Warning Modal */}
      <Modal
        isOpen={isOverpaymentModalOpen}
        onClose={() => setIsOverpaymentModalOpen(false)}
        title="Warning: Overpayment Detected"
        confirmLabel="Continue Anyway"
        cancelLabel="Adjust Amount"
        onConfirm={() => saveSettlement(pendingSettlementData)}
        isConfirmLoading={createSettlementMutation.isPending}
        variant="danger"
      >
        <div className="flex flex-col gap-3 font-sans text-xs">
          <div className="flex items-start gap-2.5 p-3 bg-error/10 border border-error/20 rounded-chip text-error">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-normal font-semibold">
              This amount is larger than what is currently owed!
            </p>
          </div>
          {pendingSettlementData && (
            balance.direction === 'owes_me' ? (
              <p className="leading-relaxed">
                This is more than <strong className="text-text-primary">{balance.label || balance.name}</strong> owes you. Balance will flip to you owing them <strong className="text-text-primary">{formatCurrency(pendingSettlementData.amount_paise - Math.abs(balance.netBalancePaise))}</strong>.
              </p>
            ) : (
              <p className="leading-relaxed">
                This is more than you owe <strong className="text-text-primary">{balance.label || balance.name}</strong>. Balance will flip to them owing you <strong className="text-text-primary">{formatCurrency(pendingSettlementData.amount_paise - Math.abs(balance.netBalancePaise))}</strong>.
              </p>
            )
          )}
          <p className="leading-relaxed font-medium">Are you sure you want to proceed?</p>
        </div>
      </Modal>

    </PageWrapper>
  )
}
