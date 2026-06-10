import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePersons } from '@/hooks/usePersons'
import { useGroups } from '@/hooks/useGroups'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { AddPersonForm } from './AddPersonForm'
import { Calendar, Plus, Trash2, Users, Check } from 'lucide-react'
import { equalSplit, formatCurrency } from '@/lib/balance'
import { toast } from '@/components/ui/Toast'

const splitSchema = z.object({
  amountRupees: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Amount must be greater than zero'
  ),
  note: z.string().min(1, 'Description is required').max(100, 'Description is too long'),
  date: z.string().min(1, 'Date is required'),
  payer: z.enum(['me', 'them']),
  groupId: z.string().optional(),
  groupPayerId: z.string().optional(),
})

type SplitFormValues = z.infer<typeof splitSchema>

interface GroupSplitFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export const GroupSplitForm: React.FC<GroupSplitFormProps> = ({ onSuccess, onCancel }) => {
  const { data: persons, isLoading: isPersonsLoading } = usePersons()
  const { data: groups } = useGroups()
  const createTxMutation = useCreateTransaction()

  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([])
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // Load draft from localStorage on init
  const getInitialValues = (): SplitFormValues => {
    const saved = localStorage.getItem('yk_draft_group_split')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.selectedPersonIds) {
          setSelectedPersonIds(parsed.selectedPersonIds)
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
      groupId: '',
      groupPayerId: '',
    }
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SplitFormValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: getInitialValues()
  })

  const payer = watch('payer')
  const groupId = watch('groupId')
  const groupPayerId = watch('groupPayerId')
  const amountRupees = watch('amountRupees')
  const note = watch('note')
  const date = watch('date')

  // Save drafts
  useEffect(() => {
    const draftData = { 
      amountRupees, note, date, payer, groupId, groupPayerId,
      selectedPersonIds 
    }
    localStorage.setItem('yk_draft_group_split', JSON.stringify(draftData))
  }, [amountRupees, note, date, payer, groupId, groupPayerId, selectedPersonIds])

  // Check if draft was restored on mount
  useEffect(() => {
    const saved = localStorage.getItem('yk_draft_group_split')
    if (saved) {
      setDraftRestored(true)
    }
  }, [])

  // Auto-populate group members when group is selected
  useEffect(() => {
    if (groupId && groups) {
      const group = groups.find((g) => g.id === groupId)
      if (group) {
        const memberIds = group.group_persons.map((gp) => gp.person_id)
        setSelectedPersonIds(memberIds)
        if (groupPayerId && !memberIds.includes(groupPayerId)) {
          setValue('groupPayerId', '')
        }
      }
    }
  }, [groupId, groups, setValue, groupPayerId])

  const clearDraft = () => {
    localStorage.removeItem('yk_draft_group_split')
    setValue('amountRupees', '')
    setValue('note', '')
    setValue('date', new Date().toISOString().split('T')[0])
    setValue('payer', 'me')
    setValue('groupId', '')
    setValue('groupPayerId', '')
    setSelectedPersonIds([])
    setDraftRestored(false)
    toast.info('Draft cleared')
  }

  // Split calculations preview
  const amountVal = parseFloat(amountRupees)
  const isAmountValid = !isNaN(amountVal) && amountVal > 0
  const totalPeople = selectedPersonIds.length + 1 // friends + Me
  
  const splitsPreview = (() => {
    if (!isAmountValid || totalPeople <= 1) return []
    const amountPaise = Math.round(amountVal * 100)
    const shares = equalSplit(amountPaise, totalPeople)

    if (payer === 'me') {
      return selectedPersonIds.map((pid, idx) => {
        const person = persons?.find((p) => p.id === pid)
        return {
          name: person ? (person.label || person.name) : 'Friend',
          sharePaise: shares[idx + 1], // first share is mine
          direction: 'owes_me' as const,
        }
      })
    } else {
      const payerPerson = persons?.find((p) => p.id === groupPayerId)
      if (!payerPerson) return []
      return [
        {
          name: payerPerson.label || payerPerson.name,
          sharePaise: shares[0], // my share
          direction: 'i_owe' as const,
        },
      ]
    }
  })()

  const onSubmit = async (values: SplitFormValues) => {
    if (selectedPersonIds.length === 0) {
      toast.error('Select at least one friend to split with')
      return
    }
    if (values.payer === 'them' && !values.groupPayerId) {
      toast.error('Select which friend paid')
      return
    }
    if (values.payer === 'them' && !selectedPersonIds.includes(values.groupPayerId || '')) {
      toast.error('The payer must be part of the split group')
      return
    }

    const amountPaise = Math.round(parseFloat(values.amountRupees) * 100)
    const shares = equalSplit(amountPaise, totalPeople)
    
    let splits: any[] = []
    if (values.payer === 'me') {
      splits = selectedPersonIds.map((pid, idx) => ({
        person_id: pid,
        share_amount_paise: shares[idx + 1],
        direction: 'owes_me',
      }))
    } else {
      splits = [
        {
          person_id: values.groupPayerId,
          share_amount_paise: shares[0],
          direction: 'i_owe',
        },
      ]
    }

    try {
      await createTxMutation.mutateAsync({
        paid_by: values.payer,
        amount_paise: amountPaise,
        note: values.note.trim() || null,
        date: values.date,
        type: 'group_split',
        group_id: values.groupId || null,
        splits,
      })

      localStorage.removeItem('yk_draft_group_split')
      toast.success('Group split logged!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save transaction')
    }
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-left">
      {draftRestored && (
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            placeholder="Pizza dinner, cab fare..."
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

        {/* Payer Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
            Who Paid?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setValue('payer', 'me')
                setValue('groupPayerId', '')
              }}
              className={`
                py-2.5 text-xs font-bold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider
                ${payer === 'me' ? 'bg-accent text-text-on-accent border-transparent shadow-cta' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
              `}
            >
              I Paid
            </button>
            <button
              type="button"
              onClick={() => setValue('payer', 'them')}
              className={`
                py-2.5 text-xs font-bold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider
                ${payer === 'them' ? 'bg-accent text-text-on-accent border-transparent shadow-cta' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
              `}
            >
              A Friend Paid
            </button>
          </div>
        </div>

        {/* Group Selector */}
        {groups && groups.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
              Group (Optional)
            </label>
            <select
              value={groupId}
              onChange={(e) => setValue('groupId', e.target.value)}
              className="w-full bg-card text-text-primary border border-border rounded-chip px-3.5 py-3 text-sm outline-none focus:border-text-secondary font-semibold"
            >
              <option value="">-- No Group (Ad-hoc Split) --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Split with checklist */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
              Split with (Select Friends)
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
            <div className="h-16 bg-divider/30 animate-pulse rounded-chip" />
          ) : persons && persons.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2.5 border border-border rounded-chip bg-card max-h-[140px] overflow-y-auto">
              {persons.map((person) => {
                const isSelected = selectedPersonIds.includes(person.id)
                const displayName = person.label || person.name
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      setSelectedPersonIds((prev) =>
                        prev.includes(person.id)
                          ? prev.filter((id) => id !== person.id)
                          : [...prev, person.id]
                      )
                    }}
                    className={`
                      px-3 py-1.5 rounded-chip text-xs font-semibold border flex items-center gap-1 transition-all select-none cursor-pointer
                      ${isSelected ? 'bg-accent/15 text-accent border-accent/30 shadow-sm' : 'bg-divider/30 border-divider text-text-secondary hover:text-text-primary'}
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {displayName}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-border rounded-chip text-center text-xs text-text-tertiary">
              No friends available. Add one above.
            </div>
          )}
        </div>

        {/* Who Paid dropdown (whenpayer === them) */}
        {payer === 'them' && selectedPersonIds.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
              Which Friend Paid?
            </label>
            <select
              value={groupPayerId}
              onChange={(e) => setValue('groupPayerId', e.target.value)}
              className="w-full bg-card text-text-primary border border-border rounded-chip px-3.5 py-3 text-sm outline-none focus:border-text-secondary font-semibold"
              required
            >
              <option value="">-- Select Friend Payer --</option>
              {selectedPersonIds.map((pid) => {
                const person = persons?.find((p) => p.id === pid)
                return (
                  <option key={pid} value={pid}>
                    {person ? (person.label || person.name) : 'Unknown'}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Equal Split Preview */}
        {splitsPreview.length > 0 && (
          <div className="p-4 bg-card border border-border rounded-card flex flex-col gap-3">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-[0.08em] flex items-center gap-1.5 border-b border-divider pb-2 select-none">
              <Users className="w-4 h-4 text-accent" />
              Equal Split Preview
            </span>
            <div className="flex flex-col gap-2.5 text-xs">
              {splitsPreview.map((split, i) => {
                const owesMeColor = split.direction === 'owes_me' ? 'text-positive' : 'text-negative'
                return (
                  <div key={i} className="flex justify-between items-center text-text-secondary py-0.5">
                    <span className="font-semibold text-text-primary">{split.name}</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={owesMeColor}>
                        {split.direction === 'owes_me' ? 'owes you' : 'you owe'}
                      </span>
                      <span className="font-bold text-text-primary">{formatCurrency(split.sharePaise)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
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
            setSelectedPersonIds((prev) => [...prev, person.id])
            setIsAddingPerson(false)
            toast.success(`Friend ${person.name} added!`)
          }}
          onCancel={() => setIsAddingPerson(false)}
        />
      </BottomSheet>
    </div>
  )
}
