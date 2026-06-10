import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getNetBalance } from '@/lib/balance'

export interface Settlement {
  id: string
  user_id: string
  person_id: string
  amount_paise: number
  direction: 'i_paid' | 'they_paid'
  method: 'cash' | 'upi' | 'other'
  note: string | null
  date: string
  created_at: string
  persons?: {
    name: string
    label: string | null
  } | null
}

export function useSettlements() {
  return useQuery<Settlement[]>({
    queryKey: ['settlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          persons (
            name,
            label
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Settlement[]
    },
  })
}

export interface CreateSettlementParams {
  person_id: string
  amount_paise: number
  direction: 'i_paid' | 'they_paid'
  method: 'cash' | 'upi' | 'other'
  note?: string | null
  date: string
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateSettlementParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Insert the settlement
      const { data: settlement, error: sError } = await supabase
        .from('settlements')
        .insert({
          user_id: user.id,
          person_id: params.person_id,
          amount_paise: params.amount_paise,
          direction: params.direction,
          method: params.method,
          note: params.note || null,
          date: params.date,
        })
        .select()
        .single()

      if (sError) throw sError

      // 2. Recompute net balance and update is_settled status
      // Fetch all transaction_persons for this person
      const { data: txPersons, error: txError } = await supabase
        .from('transaction_persons')
        .select(`
          direction,
          share_amount_paise,
          transactions!inner (user_id)
        `)
        .eq('person_id', params.person_id)
        .eq('transactions.user_id', user.id)

      if (txError) throw txError

      // Fetch all settlements for this person
      const { data: settlements, error: setError } = await supabase
        .from('settlements')
        .select('amount_paise, direction')
        .eq('person_id', params.person_id)
        .eq('user_id', user.id)

      if (setError) throw setError

      const netBalance = getNetBalance(
        txPersons.map(tp => ({
          direction: tp.direction as 'owes_me' | 'i_owe',
          share_amount_paise: tp.share_amount_paise
        })),
        settlements
      )

      const isSettled = netBalance === 0

      // Update is_settled on all transaction_persons for this person
      // In Supabase, transaction_persons is linked to transaction which is owned by user.
      // So we can update all transaction_persons for this person_id that belong to our transactions.
      // We can do it by using subquery or simple update on transaction_persons if RLS handles it.
      // Actually, since RLS policy says:
      // "Users can CRUD own transaction_persons using exists(select 1 from transactions where t.id = transaction_id and t.user_id = auth.uid())"
      // We can update them by filtering by person_id. Let's make sure we update only our transaction_persons.
      // We can fetch the IDs of transaction_persons for this person that belong to our transactions and update them.
      // But we can also query transaction_persons with transaction user_id check.
      // In Postgres, we can do:
      const { error: updateError } = await supabase
        .from('transaction_persons')
        .update({ is_settled: isSettled })
        .eq('person_id', params.person_id)
        // RLS policies will automatically restrict this to our own records!
        // We can just query by person_id.

      if (updateError) {
        console.error('Error updating is_settled flag:', updateError)
        // Don't crash the settlement logging if this hint update fails
      }

      return settlement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction_persons_all'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}
