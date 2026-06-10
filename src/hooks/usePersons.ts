import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Person {
  id: string
  user_id: string
  name: string
  label: string | null
  phone: string | null
  upi_id: string | null
  linked_user_id: string | null
  created_at: string
}

export function usePersons() {
  return useQuery<Person[]>({
    queryKey: ['persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (person: {
      name: string
      label?: string | null
      phone?: string | null
      upi_id?: string | null
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('persons')
        .insert({
          user_id: user.id,
          name: person.name,
          label: person.label || null,
          phone: person.phone || null,
          upi_id: person.upi_id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Person
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (person: Partial<Person> & { id: string }) => {
      const { data, error } = await supabase
        .from('persons')
        .update({
          name: person.name,
          label: person.label || null,
          phone: person.phone || null,
          upi_id: person.upi_id || null,
        })
        .eq('id', person.id)
        .select()
        .single()

      if (error) throw error
      return data as Person
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['person', variables.id] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('persons').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
  })
}
