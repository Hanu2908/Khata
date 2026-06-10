import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Transaction {
  id: string
  user_id: string
  paid_by: 'me' | 'them' | 'third_party'
  amount_paise: number
  currency: string
  note: string | null
  date: string
  type: 'direct' | 'group_split' | 'settlement'
  group_id: string | null
  created_at: string
}

export interface TransactionPersonDetail {
  id: string
  transaction_id: string
  person_id: string
  share_amount_paise: number
  direction: 'owes_me' | 'i_owe'
  is_settled: boolean
  created_at: string
  persons: {
    name: string
    label: string | null
    upi_id: string | null
  } | null
  transactions: {
    user_id: string
    paid_by: 'me' | 'them' | 'third_party'
    amount_paise: number
    note: string | null
    date: string
    type: 'direct' | 'group_split' | 'settlement'
    group_id: string | null
  } | null
}

export interface TransactionWithPersons extends Transaction {
  transaction_persons: {
    id: string
    person_id: string
    share_amount_paise: number
    direction: 'owes_me' | 'i_owe'
    is_settled: boolean
    persons: {
      name: string
      label: string | null
    } | null
  }[]
}

export function useTransactions() {
  return useQuery<TransactionWithPersons[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_persons (
            id,
            person_id,
            share_amount_paise,
            direction,
            is_settled,
            persons (
              name,
              label
            )
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as TransactionWithPersons[]
    },
  })
}

// Fetch all transaction_persons for balance calculation
export function useTransactionPersons() {
  return useQuery<TransactionPersonDetail[]>({
    queryKey: ['transaction_persons_all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transaction_persons')
        .select(`
          id,
          transaction_id,
          person_id,
          share_amount_paise,
          direction,
          is_settled,
          created_at,
          persons (name, label, upi_id),
          transactions!inner (user_id, paid_by, amount_paise, note, date, type, group_id)
        `)
        .eq('transactions.user_id', user.id)

      if (error) throw error
      return (data || []) as unknown as TransactionPersonDetail[]
    },
  })
}

export interface CreateTransactionParams {
  paid_by: 'me' | 'them'
  amount_paise: number
  note?: string | null
  date: string
  type: 'direct' | 'group_split'
  group_id?: string | null
  // Array of people involved in the split (excluding the payer for group_split, as per rule)
  splits: {
    person_id: string
    share_amount_paise: number
    direction: 'owes_me' | 'i_owe'
  }[]
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateTransactionParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Insert transaction
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          paid_by: params.paid_by,
          amount_paise: params.amount_paise,
          note: params.note || null,
          date: params.date,
          type: params.type,
          group_id: params.group_id || null,
        })
        .select()
        .single()

      if (txError) throw txError

      // 2. Insert transaction_persons (if any splits exist)
      if (params.splits.length > 0) {
        const tpRows = params.splits.map((split) => ({
          transaction_id: tx.id,
          person_id: split.person_id,
          share_amount_paise: split.share_amount_paise,
          direction: split.direction,
          is_settled: false,
        }))

        const { error: tpError } = await supabase
          .from('transaction_persons')
          .insert(tpRows)

        if (tpError) {
          // Attempt rollback of transaction if transaction_persons fails
          await supabase.from('transactions').delete().eq('id', tx.id)
          throw tpError
        }
      }

      return tx
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction_persons_all'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction_persons_all'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}
