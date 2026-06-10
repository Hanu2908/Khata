import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePersons } from '@/hooks/usePersons'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { AddPersonForm } from './AddPersonForm'
import { Calendar, Plus, ShieldAlert, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react'
import { equalSplit } from '@/lib/balance'
import { toast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

const directSchema = z.object({
  amountRupees: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Amount must be greater than zero'
  ),
  note: z.string().min(1, 'Description is required').max(100, 'Description is too long'),
  date: z.string().min(1, 'Date is required'),
  payer: z.enum(['me', 'them']),
  personId: z.string().min(1, 'Please select a friend'),
})

type DirectFormValues = z.infer<typeof directSchema>

interface DirectIOUFormProps {
  initialValues?: {
    id: string
    amount_paise: number
    note: string | null
    date: string
    paid_by: 'me' | 'them'
    personId: string
  }
  lockedPersonId?: string
  onSuccess: () => void
  onCancel?: () => void
}

export const DirectIOUForm: React.FC<DirectIOUFormProps> = ({
  initialValues,
  lockedPersonId,
  onSuccess,
  onCancel,
}) => {
  const { data: persons, isLoading: isPersonsLoading } = usePersons()
  const createTxMutation = useCreateTransaction()
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // Load draft from localStorage on init
  const getInitialValues = (): DirectFormValues => {
    if (initialValues) {
      return {
        amountRupees: (initialValues.amount_paise / 100).toString(),
        note: initialValues.note || '',
        date: initialValues.date,
        payer: initialValues.paid_by,
        personId: initialValues.personId,
      }
    }

    const saved = localStorage.getItem('yk_draft_direct')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure locked person ID is respected even in drafts
        if (lockedPersonId) {
          parsed.personId = lockedPersonId
        }
        return parsed
      } catch (e) {
        // Fallback
      }
    }

    return {
      amountRupees: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
      payer: 'me',
      personId: lockedPersonId || '',
    }
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DirectFormValues>({
    resolver: zodResolver(directSchema),
    defaultValues: getInitialValues()
  })

  const payer = watch('payer')
  const personId = watch('personId')
  const amountRupees = watch('amountRupees')
  const note = watch('note')
  const date = watch('date')

  // Save drafts as user types
  useEffect(() => {
    if (!initialValues) {
      const draftData = { amountRupees, note, date, payer, personId }
      localStorage.setItem('yk_draft_direct', JSON.stringify(draftData))
    }
  }, [amountRupees, note, date, payer, personId, initialValues])

  // Check if draft was restored on mount
  useEffect(() => {
    if (!initialValues) {
      const saved = localStorage.getItem('yk_draft_direct')
      if (saved) {
        setDraftRestored(true)
      }
    }
  }, [initialValues])

  const clearDraft = () => {
    localStorage.removeItem('yk_draft_direct')
    setValue('amountRupees', '')
    setValue('note', '')
    setValue('date', new Date().toISOString().split('T')[0])
    setValue('payer', 'me')
    setValue('personId', lockedPersonId || '')
    setDraftRestored(false)
    toast.info('Draft cleared')
  }

  // Warning for flipped direction in edit mode
  const showDirectionWarning = initialValues && payer !== initialValues.paid_by

  const onSubmit = async (values: DirectFormValues) => {
    const amountVal = parseFloat(values.amountRupees)
    const amountPaise = Math.round(amountVal * 100)

    const splits = [
      {
        person_id: values.personId,
        share_amount_paise: amountPaise,
        direction: (values.payer === 'me' ? 'owes_me' : 'i_owe') as 'owes_me' | 'i_owe',
      },
    ]

    try {
      // If we are editing, we would call an update mutation.
      // Note: build spec says: G9: '/add' with query params, reuse direct splits.
      // If initialValues exist, we delete the old one first, then create the new one (standard lightweight transaction replacement for V1).
      // Or if there is an update mutation in useTransactions, we use it. Let's check: useCreateTransaction handles insert.
      // Let's replace the entry.
      if (initialValues) {
        // For editing, we delete the old one and insert the new one
        await supabase.from('transactions').delete().eq('id', initialValues.id)
      }

      await createTxMutation.mutateAsync({
        paid_by: values.payer,
        amount_paise: amountPaise,
        note: values.note.trim() || null,
        date: values.date,
        type: 'direct',
        splits,
      })

      localStorage.removeItem('yk_draft_direct')
      toast.success(initialValues ? 'Transaction updated' : 'Transaction saved')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save transaction')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {draftRestored && !initialValues && (
        <div className="p-3 bg-divider/40 border border-border rounded-chip flex items-center justify-between text-xs text-text-secondary select-none">
          <span>Draft restored from browser.</span>
          <button
            type="button"
            onClick={clearDraft}
            className="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      {showDirectionWarning && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-chip text-accent text-xs font-semibold leading-relaxed flex items-start gap-2 select-none">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>Warning: You changed who paid! This flips the ledger direction.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 font-sans text-left">
        
        {/* Amount */}
        <Input
          label="Total Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          prefixText="₹"
          error={errors.amountRupees?.message}
          required
          {...register('amountRupees')}
        />

        {/* Note & Date */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Note/Description"
            type="text"
            placeholder="Chai, auto split..."
            error={errors.note?.message}
            required
            {...register('note')}
          />
          <Input
            label="Transaction Date"
            type="date"
            error={errors.date?.message}
            prefixIcon={<Calendar className="w-4 h-4" />}
            required
            {...register('date')}
          />
        </div>

        {/* C4 Terminology: "Gave / Took" instead of Direct IOU */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
            Choose Action
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('payer', 'me')}
              className={`
                py-3 text-xs font-bold rounded-chip border text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider
                ${payer === 'me' ? 'bg-accent text-text-on-accent border-transparent shadow-cta' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
              `}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              I Gave (Owes Me)
            </button>
            <button
              type="button"
              onClick={() => setValue('payer', 'them')}
              className={`
                py-3 text-xs font-bold rounded-chip border text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider
                ${payer === 'them' ? 'bg-accent text-text-on-accent border-transparent shadow-cta' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
              `}
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" />
              I Took (I Owe)
            </button>
          </div>
        </div>

        {/* Friend Selector */}
        {!lockedPersonId && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
                Select Friend
              </label>
              <button
                type="button"
                onClick={() => setIsAddingPerson(true)}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Friend
              </button>
            </div>

            {isPersonsLoading ? (
              <div className="h-12 bg-divider/30 animate-pulse rounded-chip" />
            ) : persons && persons.length > 0 ? (
              <>
                <select
                  value={personId}
                  onChange={(e) => setValue('personId', e.target.value)}
                  className={`w-full bg-card text-text-primary border rounded-chip px-3.5 py-3.5 text-sm outline-none focus:border-text-secondary font-semibold ${
                    errors.personId ? 'border-error' : 'border-border'
                  }`}
                  required
                >
                  <option value="">-- Choose Friend --</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.label || person.name}
                    </option>
                  ))}
                </select>
                {errors.personId?.message && (
                  <span className="text-[11px] text-error font-medium px-1 mt-0.5">
                    {errors.personId.message}
                  </span>
                )}
              </>
            ) : (
              <div className="p-4 border border-dashed border-border rounded-chip text-center text-xs text-text-tertiary">
                No friends added yet. Tap Add Friend above.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5 mt-4">
          {onCancel && (
            <Button type="button" variant="ghost" fullWidth onClick={onCancel} disabled={createTxMutation.isPending}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createTxMutation.isPending}
            className="font-semibold"
          >
            Save Entry
          </Button>
        </div>
      </form>

      {/* Add New Contact Sheet */}
      <BottomSheet isOpen={isAddingPerson} onClose={() => setIsAddingPerson(false)} title="Add Friend">
        <AddPersonForm
          onSuccess={(person) => {
            setValue('personId', person.id)
            setIsAddingPerson(false)
            toast.success(`Friend ${person.name} added!`)
          }}
          onCancel={() => setIsAddingPerson(false)}
        />
      </BottomSheet>
    </div>
  )
}
