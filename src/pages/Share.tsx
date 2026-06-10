import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getNetBalance, getBalanceDirection, type BalanceDirection } from '@/lib/balance'
import { AlertCircle } from 'lucide-react'
import { ShareableSummary } from '@/components/share/ShareableSummary'

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

export default function Share() {
  const { token } = useParams<{ token: string }>()
  
  const [isLoading, setIsLoading] = useState(true)
  const [errorType, setErrorType] = useState<'none' | 'not_found' | 'expired' | 'generic'>('none')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
          expiresAt: data.expiresAt,
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

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <ShareableSummary
        ledger={ledger}
        token={token!}
        currentUserId={currentUserId}
      />
    </div>
  )
}
