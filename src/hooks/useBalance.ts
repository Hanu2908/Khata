import { usePersons } from './usePersons'
import { useTransactionPersons } from './useTransactions'
import { useSettlements } from './useSettlements'
import { getNetBalance, type BalanceDirection, getBalanceDirection } from '@/lib/balance'

export interface PersonBalance {
  personId: string
  name: string
  label: string | null
  upiId: string | null
  phone: string | null
  netBalancePaise: number
  direction: BalanceDirection
}

export function useBalance() {
  const personsQuery = usePersons()
  const txPersonsQuery = useTransactionPersons()
  const settlementsQuery = useSettlements()

  const isLoading =
    personsQuery.isLoading ||
    txPersonsQuery.isLoading ||
    settlementsQuery.isLoading

  const isError =
    personsQuery.isError ||
    txPersonsQuery.isError ||
    settlementsQuery.isError

  const error =
    personsQuery.error ||
    txPersonsQuery.error ||
    settlementsQuery.error

  // Compute balances client-side from cache
  const data = (() => {
    if (isLoading || isError || !personsQuery.data) {
      return {
        balances: [] as PersonBalance[],
        peopleOweMeTotalPaise: 0,
        iOwePeopleTotalPaise: 0,
      }
    }

    const persons = personsQuery.data
    const allTxPersons = txPersonsQuery.data || []
    const allSettlements = settlementsQuery.data || []

    let peopleOweMeTotalPaise = 0
    let iOwePeopleTotalPaise = 0

    const balances: PersonBalance[] = persons.map((person) => {
      // Get all transaction splits for this person
      const personTxPersons = allTxPersons.filter(
        (tp) => tp.person_id === person.id
      )

      // Get all settlements for this person
      const personSettlements = allSettlements.filter(
        (s) => s.person_id === person.id
      )

      const netBalancePaise = getNetBalance(
        personTxPersons.map((tp) => ({
          direction: tp.direction,
          share_amount_paise: tp.share_amount_paise,
        })),
        personSettlements
      )

      const direction = getBalanceDirection(netBalancePaise)

      if (netBalancePaise > 0) {
        peopleOweMeTotalPaise += netBalancePaise
      } else if (netBalancePaise < 0) {
        iOwePeopleTotalPaise += Math.abs(netBalancePaise)
      }

      return {
        personId: person.id,
        name: person.name,
        label: person.label,
        upiId: person.upi_id,
        phone: person.phone,
        netBalancePaise,
        direction,
      }
    })

    // Sort by absolute balance magnitude descending (most active first)
    balances.sort((a, b) => Math.abs(b.netBalancePaise) - Math.abs(a.netBalancePaise))

    return {
      balances,
      peopleOweMeTotalPaise,
      iOwePeopleTotalPaise,
    }
  })()

  return {
    ...data,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([
        personsQuery.refetch(),
        txPersonsQuery.refetch(),
        settlementsQuery.refetch(),
      ])
    },
  }
}

// Helper hook to fetch balance and history for a specific person
export function usePersonLedger(personId: string) {
  const { balances, isLoading, isError, error, refetch } = useBalance()
  const txPersonsQuery = useTransactionPersons()
  const settlementsQuery = useSettlements()

  const personBalance = balances.find((b) => b.personId === personId)

  const ledgerData = (() => {
    if (isLoading || isError) {
      return {
        balance: null,
        history: [] as any[],
      }
    }

    const allTxPersons = txPersonsQuery.data || []
    const allSettlements = settlementsQuery.data || []

    // Get transactions for this person (splits where they are involved)
    const txs = allTxPersons
      .filter((tp) => tp.person_id === personId)
      .map((tp) => ({
        id: tp.id,
        type: 'transaction' as const,
        date: tp.transactions?.date || '',
        created_at: tp.created_at,
        amount_paise: tp.share_amount_paise,
        direction: tp.direction,
        note: tp.transactions?.note || '',
        paid_by: tp.transactions?.paid_by || '',
        txType: tp.transactions?.type || 'direct',
      }))

    // Get settlements for this person
    const sets = allSettlements
      .filter((s) => s.person_id === personId)
      .map((s) => ({
        id: s.id,
        type: 'settlement' as const,
        date: s.date,
        created_at: s.created_at,
        amount_paise: s.amount_paise,
        method: s.method,
        note: s.note || '',
        direction: s.direction,
      }))

    // Combine and sort by date ascending, then created_at ascending for chronological calculation
    const chronological = [...txs, ...sets].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.created_at.localeCompare(b.created_at)
    })

    // Compute running balance at each point in time
    let sum = 0
    const historyWithBalances = chronological.map((item) => {
      const isTx = item.type === 'transaction'
      if (isTx) {
        sum += item.direction === 'owes_me' ? item.amount_paise : -item.amount_paise
      } else {
        sum += item.direction === 'i_paid' ? item.amount_paise : -item.amount_paise
      }
      return {
        ...item,
        runningBalance: sum,
      }
    })

    // Sort by date descending, then created_at descending (newest first for UI rendering)
    const history = historyWithBalances.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.created_at.localeCompare(a.created_at)
    })

    return {
      balance: personBalance || null,
      history,
    }
  })()

  return {
    ...ledgerData,
    isLoading,
    isError,
    error,
    refetch,
  }
}
