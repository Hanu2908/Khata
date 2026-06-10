import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Group {
  id: string
  user_id: string
  name: string
  created_at: string
  group_persons: {
    person_id: string
    persons: {
      id: string
      name: string
      label: string | null
    } | null
  }[]
}

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_persons (
            person_id,
            persons (
              id,
              name,
              label
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Group[]
    },
  })
}

export interface CreateGroupParams {
  name: string
  personIds: string[]
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateGroupParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          user_id: user.id,
          name: params.name,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // 2. Link members if any are selected
      if (params.personIds.length > 0) {
        const gpRows = params.personIds.map((pid) => ({
          group_id: group.id,
          person_id: pid,
        }))

        const { error: gpError } = await supabase
          .from('group_persons')
          .insert(gpRows)

        if (gpError) {
          // Attempt cleanup of group on member mapping failure
          await supabase.from('groups').delete().eq('id', group.id)
          throw gpError
        }
      }

      return group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('groups').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
