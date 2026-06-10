import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActivityItem {
  id: string
  type: 'transaction' | 'settlement'
  date: string           // YYYY-MM-DD
  created_at: string     // ISO string
  personName: string     // display name (label ?? name)
  personId: string
  amountPaise: number
  note: string | null
  direction?: 'owes_me' | 'i_owe' | 'i_paid' | 'they_paid'
  method?: 'cash' | 'upi' | 'other' // settlements only
  txType?: 'direct' | 'group_split' | 'settlement' // transactions only
}

export function useActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ['activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const dateLimit = ninetyDaysAgo.toISOString().split('T')[0]

      // 1. Fetch recent transaction_persons (last 90 days)
      const { data: tpData, error: tpError } = await supabase
        .from('transaction_persons')
        .select(`
          id,
          share_amount_paise,
          direction,
          created_at,
          persons (
            id,
            name,
            label
          ),
          transactions!inner (
            id,
            user_id,
            date,
            note,
            type
          )
        `)
        .eq('transactions.user_id', user.id)
        .gte('transactions.date', dateLimit)

      if (tpError) throw tpError

      // 2. Fetch recent settlements (last 90 days)
      const { data: sData, error: sError } = await supabase
        .from('settlements')
        .select(`
          id,
          person_id,
          amount_paise,
          direction,
          method,
          note,
          date,
          created_at,
          persons (
            name,
            label
          )
        `)
        .eq('user_id', user.id)
        .gte('date', dateLimit)

      if (sError) throw sError

      // 3. Map transaction_persons into ActivityItem format
      const txItems: ActivityItem[] = (tpData || []).map((tp: any) => {
        const person = tp.persons
        const tx = tp.transactions
        const displayName = person
          ? (person.label || person.name)
          : 'Unknown'

        return {
          id: tp.id,
          type: 'transaction',
          date: tx.date,
          created_at: tp.created_at,
          personName: displayName,
          personId: person?.id || '',
          amountPaise: tp.share_amount_paise,
          note: tx.note,
          direction: tp.direction,
          txType: tx.type,
        }
      })

      // 4. Map settlements into ActivityItem format
      const sItems: ActivityItem[] = (sData || []).map((s: any) => {
        const person = s.persons
        const displayName = person
          ? (person.label || person.name)
          : 'Unknown'

        return {
          id: s.id,
          type: 'settlement',
          date: s.date,
          created_at: s.created_at,
          personName: displayName,
          personId: s.person_id,
          amountPaise: s.amount_paise,
          note: s.note,
          method: s.method,
          direction: s.direction,
        }
      })

      // 5. Merge and sort: date desc, then created_at desc
      const merged = [...txItems, ...sItems].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.created_at.localeCompare(a.created_at)
      })

      return merged
    },
  })
}
