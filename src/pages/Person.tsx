import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { usePersonLedger, useBalance } from '@/hooks/useBalance'
import { useDeleteSettlement } from '@/hooks/useSettlements'
import { useShareToken, useCreateShareToken, useDeleteShareToken } from '@/hooks/useShare'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { formatCurrency } from '@/lib/balance'
import { buildShareURL, buildShareMessage, buildWhatsAppURL } from '@/lib/share'
import { 
  Send, Share2, ShieldAlert, Sparkles, RefreshCw, 
  AlertCircle, Copy, Check, Trash2, ArrowUpRight, ArrowDownLeft, Search 
} from 'lucide-react'

// Extracted Ledger components
import { LedgerRow } from '@/components/ledger/LedgerRow'
import { DateGroupHeader } from '@/components/ledger/DateGroupHeader'
import { TransactionDetailSheet } from '@/components/ledger/TransactionDetailSheet'
import { LogSettlementForm } from '@/components/forms/LogSettlementForm'
import { PersonCard } from '@/components/ledger/PersonCard'
import { Input } from '@/components/ui/Input'

export default function Person() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Track the selected contact ID locally for two-column desktop navigation
  const [selectedPersonId, setSelectedPersonId] = useState<string>(id || '')
  
  // Search for the left desktop list
  const [leftSearchQuery, setLeftSearchQuery] = useState('')

  // Sync selected person with URL parameter if it changes (e.g., direct navigation)
  useEffect(() => {
    if (id) {
      setSelectedPersonId(id)
    }
  }, [id])

  if (!selectedPersonId) {
    return (
      <PageWrapper>
        <div className="p-4 text-center font-sans">Contact ID is missing.</div>
      </PageWrapper>
    )
  }

  // Fetch data specific to the selected contact
  const { balance, history, isLoading, isError, error, refetch } = usePersonLedger(selectedPersonId)
  const { data: shareToken } = useShareToken(selectedPersonId)
  const { balances: allPeople, isLoading: isAllPeopleLoading } = useBalance()
  
  const createShareTokenMutation = useCreateShareToken()
  const deleteShareTokenMutation = useDeleteShareToken()
  const deleteTxMutation = useDeleteTransaction()
  const deleteSettlementMutation = useDeleteSettlement()

  // Settlement Sheet State
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<any>(null)
  
  // Share link success state
  const [copiedLink, setCopiedLink] = useState(false)

  // Details Sheet State
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  const handlePersonClick = (personId: string) => (e: React.MouseEvent) => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      e.preventDefault()
      setSelectedPersonId(personId)
      setSelectedItem(null)
      setIsDetailOpen(false)
      setIsSettleOpen(false)
      setEditingSettlement(null)
    }
  }

  const handleOpenSettle = () => {
    setEditingSettlement(null)
    setIsSettleOpen(true)
  }

  const handleGenerateLink = async () => {
    try {
      const tokenObj = await createShareTokenMutation.mutateAsync(selectedPersonId)
      const url = buildShareURL(tokenObj.token)
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err: any) {
      alert(err.message || 'Failed to create share link')
    }
  }

  const handleRevokeLink = async () => {
    if (confirm('Are you sure you want to delete this share link? Anyone using the old link will lose access immediately.')) {
      await deleteShareTokenMutation.mutateAsync(selectedPersonId)
    }
  }

  const handleCopyLink = () => {
    if (shareToken) {
      const url = buildShareURL(shareToken.token)
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleWhatsAppShare = () => {
    if (shareToken && balance) {
      const url = buildShareURL(shareToken.token)
      const msg = buildShareMessage(balance.netBalancePaise, url)
      const waUrl = buildWhatsAppURL(msg)
      window.open(waUrl, '_blank')
    }
  }

  // Row Press Details Sheet
  const handleRowPress = (itemId: string, type: 'transaction' | 'settlement') => {
    const found = history?.find((h) => h.id === itemId && h.type === type)
    if (found) {
      setSelectedItem(found)
      setIsDetailOpen(true)
    }
  }

  const handleEditItem = () => {
    if (!selectedItem) return
    setIsDetailOpen(false)
    if (selectedItem.type === 'transaction') {
      navigate(`/add?edit=${selectedItem.id}`)
    } else {
      // Prefill settlement form for editing
      setEditingSettlement(selectedItem)
      setIsSettleOpen(true)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return
    setIsDeletingItem(true)
    try {
      if (selectedItem.type === 'transaction') {
        await deleteTxMutation.mutateAsync(selectedItem.id)
      } else {
        await deleteSettlementMutation.mutateAsync(selectedItem.id)
      }
      setIsDetailOpen(false)
      setSelectedItem(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry')
    } finally {
      setIsDeletingItem(false)
    }
  }

  const filteredPeople = allPeople?.filter((p) =>
    p.name.toLowerCase().includes(leftSearchQuery.toLowerCase()) ||
    (p.label && p.label.toLowerCase().includes(leftSearchQuery.toLowerCase()))
  ) || []

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="animate-pulse flex flex-col gap-4 mt-4 font-sans">
          <div className="w-full h-32 bg-card rounded-card border border-border" />
          <div className="w-32 h-4 bg-border rounded mt-2" />
          <div className="flex gap-2.5">
            <div className="flex-1 h-12 bg-border rounded-cta" />
            <div className="flex-1 h-12 bg-border rounded-cta" />
          </div>
          <div className="w-full h-48 bg-card rounded-card border border-border mt-4" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !balance) {
    return (
      <PageWrapper>
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
  
  // Option A color scheme: negative/debt is text-negative
  const textColors = {
    owes_me: 'text-positive',
    i_owe: 'text-negative',
    settled: 'text-text-tertiary',
  }
  const directionLabels = {
    owes_me: 'owes you',
    i_owe: 'you owe',
    settled: 'settled up',
  }

  const isExpired = shareToken ? new Date(shareToken.expires_at) < new Date() : false
  let lastDate = ''

  return (
    <PageWrapper>
      <div className="flex gap-6 h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] items-start">
        
        {/* Left Column - Friends List (Desktop Only) */}
        <div className="hidden lg:flex flex-col gap-3.5 w-[280px] shrink-0 border-r border-divider pr-4 overflow-y-auto h-full pb-6 select-none">
          <div className="flex flex-col gap-2 sticky top-0 bg-bg z-10 pb-2">
            <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-secondary">
              Friends List
            </h3>
            <Input
              placeholder="Filter..."
              value={leftSearchQuery}
              onChange={(e) => setLeftSearchQuery(e.target.value)}
              prefixIcon={<Search className="w-3.5 h-3.5" />}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            {isAllPeopleLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-full h-16 bg-card border border-divider animate-pulse rounded-card" />
              ))
            ) : filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <PersonCard
                  key={person.personId}
                  personId={person.personId}
                  name={person.name}
                  label={person.label}
                  netBalancePaise={person.netBalancePaise}
                  direction={person.direction}
                  isActive={person.personId === selectedPersonId}
                  onClick={handlePersonClick(person.personId)}
                />
              ))
            ) : (
              <span className="text-xs text-text-tertiary text-center py-4">No friends found</span>
            )}
          </div>
        </div>

        {/* Right Column - Ledger Timeline Details */}
        <div className="flex-grow flex flex-col gap-5 h-full overflow-y-auto pr-1">
          {/* Contact Overview Panel */}
          <div className="bg-hero text-text-on-hero rounded-hero shadow-card p-5 flex flex-col gap-4 font-sans select-none relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            
            <div className="flex items-center justify-between z-10">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-xl font-bold tracking-tight">
                  {balance.label || balance.name}
                </h2>
                {balance.label && (
                  <span className="text-[12px] text-text-on-hero/65 leading-none font-medium">
                    Real Name: {balance.name}
                  </span>
                )}
              </div>
              {isOwesMe ? (
                <div className="w-9 h-9 rounded-full bg-positive/10 flex items-center justify-center text-positive shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              ) : isSettled ? (
                <div className="w-9 h-9 rounded-full bg-divider/10 flex items-center justify-center text-text-on-hero/50 shrink-0">
                  <Check className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-negative/10 flex items-center justify-center text-negative shrink-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5 border-t border-text-on-hero/10 pt-3 z-10">
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
          <div className="sticky bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-4 pb-4 px-1 -mx-1 z-30 flex gap-3 order-last lg:relative lg:bg-transparent lg:p-0 lg:m-0 lg:order-none shrink-0">
            <Button
              variant={isOwesMe ? 'positive' : 'primary'}
              fullWidth
              onClick={handleOpenSettle}
              className="flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-4.5 h-4.5" />
              Settle Up
            </Button>

            {shareToken && !isExpired ? (
              <Button
                variant="outline"
                fullWidth
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 border-border bg-card shadow-sm hover:bg-divider/10"
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
                className="flex items-center justify-center gap-1.5 border-border bg-card shadow-sm hover:bg-divider/10"
              >
                <Share2 className="w-4.5 h-4.5" />
                {shareToken && isExpired ? 'Renew Link' : 'Get Link'}
              </Button>
            )}
          </div>

          {/* Shared Link Control Section */}
          {shareToken && (
            <div className="p-4 bg-card border border-border rounded-card flex flex-col gap-3 font-sans shrink-0">
              {isExpired ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-error uppercase tracking-[0.08em] flex items-center gap-1.5">
                      <ShieldAlert className="w-4.5 h-4.5 text-error animate-pulse" />
                      Share Link Expired
                    </span>
                    <button
                      onClick={handleRevokeLink}
                      className="text-text-tertiary hover:text-error transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer border-none bg-transparent"
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
                    className="flex items-center gap-1.5 w-full justify-center"
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
                      className="text-text-tertiary hover:text-error transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer border-none bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke Link
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={buildShareURL(shareToken.token)}
                      className="w-full bg-divider/40 border border-border text-xs px-3 py-2 rounded-chip font-medium text-text-secondary outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-accent text-text-on-accent rounded-chip hover:bg-opacity-95 select-none transition-all duration-150 cursor-pointer shadow-sm shrink-0 border-none flex items-center justify-center"
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
          <div className="flex flex-col gap-2.5 pb-24 lg:pb-6">
            <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-secondary">
              Ledger History
            </h3>

            {history && history.length > 0 ? (
              <div className="flex flex-col gap-2">
                {history.map((item) => {
                  const showHeader = item.date !== lastDate
                  lastDate = item.date
                  return (
                    <React.Fragment key={`${item.type}-${item.id}`}>
                      {showHeader && <DateGroupHeader dateString={item.date} />}
                      <LedgerRow 
                        item={item} 
                        runningBalance={item.runningBalance} 
                        onPress={handleRowPress} 
                      />
                    </React.Fragment>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 border border-border bg-card rounded-card text-center text-xs text-text-secondary leading-relaxed font-sans">
                No transactions logged yet. Click Settle Up or use the + menu to make an entry.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Settle Up / Edit Settlement Bottom Sheet */}
      <BottomSheet
        isOpen={isSettleOpen}
        onClose={() => {
          setIsSettleOpen(false)
          setEditingSettlement(null)
        }}
        title={
          editingSettlement
            ? `Edit Settlement with ${balance.label || balance.name}`
            : `Settle Ledger with ${balance.label || balance.name}`
        }
      >
        <LogSettlementForm
          personId={selectedPersonId}
          personName={balance.label || balance.name}
          netBalancePaise={balance.netBalancePaise}
          balanceDirection={balance.direction}
          editingSettlement={editingSettlement}
          onSuccess={() => {
            setIsSettleOpen(false)
            setEditingSettlement(null)
            refetch()
          }}
          onCancel={() => {
            setIsSettleOpen(false)
            setEditingSettlement(null)
          }}
        />
      </BottomSheet>

      {/* Transaction & Settlement Details Bottom Sheet */}
      <TransactionDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={selectedItem}
        runningBalance={selectedItem?.runningBalance}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        isDeleting={isDeletingItem}
      />

    </PageWrapper>
  )
}
