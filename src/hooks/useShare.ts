import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateToken, getTokenExpiresAt } from '@/lib/share'

export interface ShareToken {
  id: string
  user_id: string
  person_id: string
  token: string
  expires_at: string
  created_at: string
}

export function useShareToken(personId: string) {
  return useQuery<ShareToken | null>({
    queryKey: ['share_token', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('person_id', personId)
        .maybeSingle()

      if (error) throw error
      return data || null
    },
  })
}

export function useCreateShareToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (personId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Delete any existing share token for this person
      await supabase
        .from('share_tokens')
        .delete()
        .eq('person_id', personId)

      // 2. Generate a new token and expiration date
      const token = generateToken()
      const expiresAt = getTokenExpiresAt()

      // 3. Insert new token
      const { data, error } = await supabase
        .from('share_tokens')
        .insert({
          user_id: user.id,
          person_id: personId,
          token,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) throw error
      return data as ShareToken
    },
    onSuccess: (_, personId) => {
      queryClient.invalidateQueries({ queryKey: ['share_token', personId] })
    },
  })
}

export function useDeleteShareToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('share_tokens')
        .delete()
        .eq('person_id', personId)

      if (error) throw error
      return personId
    },
    onSuccess: (_, personId) => {
      queryClient.invalidateQueries({ queryKey: ['share_token', personId] })
    },
  })
}
