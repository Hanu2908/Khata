import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSettlement, useUpdateSettlement } from '@/hooks/useSettlements'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { isOverpayment, formatCurrency } from '@/lib/balance'
import { Calendar, ShieldAlert } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

const settlementSchema = z.object({
  amountRupees: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Amount must be greater than zero'
  ),
  method: z.enum(['cash', 'upi', 'other']),
  note: z.string().max(100, 'Note is too long').optional(),
  date: z.string().min(1, 'Date is required'),
})

type SettlementFormValues = z.infer<typeof settlementSchema>

interface LogSettlementFormProps {
  personId: string
  personName: string
  netBalancePaise: number
  balanceDirection: 'owes_me' | 'i_owe' | 'settled'
  onSuccess: () => void
  onCancel: () => void
  editingSettlement?: {
    id: string
    amount_paise: number
    direction: 'i_paid' | 'they_paid'
    method: 'cash' | 'upi' | 'other'
    note: string | null
    date: string
  } | null
}

export const LogSettlementForm: React.FC<LogSettlementFormProps> = ({
  personId,
  personName,
  netBalancePaise,
  balanceDirection,
  onSuccess,
  onCancel,
  editingSettlement = null,
}) => {
  const createSettlementMutation = useCreateSettlement()
  const updateSettlementMutation = useUpdateSettlement()
  
  // Overpayment Modal state
  const [isOverpaymentModalOpen, setIsOverpaymentModalOpen] = useState(false)
  const [pendingParams, setPendingParams] = useState<any>(null)

  const isEditing = !!editingSettlement

  const defaultAmount = isEditing
    ? (editingSettlement.amount_paise / 100).toString()
    : balanceDirection === 'settled' 
    ? '' 
    : (Math.abs(netBalancePaise) / 100).toString()

  const defaultMethod = isEditing ? editingSettlement.method : 'cash'
  const defaultNote = isEditing ? (editingSettlement.note || '') : ''
  const defaultDate = isEditing ? editingSettlement.date : new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amountRupees: defaultAmount,
      method: defaultMethod,
      note: defaultNote,
      date: defaultDate,
    }
  })

  const method = watch('method')

  const onSubmit = async (values: SettlementFormValues) => {
    const amountVal = parseFloat(values.amountRupees)
    const amountPaise = Math.round(amountVal * 100)

    const direction = isEditing 
      ? editingSettlement.direction 
      : (balanceDirection === 'i_owe' ? 'i_paid' : 'they_paid')

    const params = {
      person_id: personId,
      amount_paise: amountPaise,
      direction,
      method: values.method,
      note: values.note?.trim() || null,
      date: values.date,
    }

    const isOver = !isEditing && isOverpayment(amountPaise, netBalancePaise)

    if (isOver) {
      setPendingParams(params)
      setIsOverpaymentModalOpen(true)
    } else {
      if (isEditing) {
        await saveSettlement({ ...params, id: editingSettlement.id })
      } else {
        await saveSettlement(params)
      }
    }
  }

  const saveSettlement = async (params: any) => {
    try {
      if (isEditing) {
        await updateSettlementMutation.mutateAsync(params)
        toast.success('Settlement updated successfully')
      } else {
        await createSettlementMutation.mutateAsync(params)
        toast.success('Settlement logged successfully')
      }
      setIsOverpaymentModalOpen(false)
      setPendingParams(null)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settlement')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 font-sans text-left">
        
        {/* Amount */}
        <Input
          label="Payment Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          prefixText="₹"
          error={errors.amountRupees?.message}
          required
          {...register('amountRupees')}
          helperText={balanceDirection !== 'settled' ? `Outstanding balance: ${formatCurrency(netBalancePaise)}` : ''}
        />

        {/* Payment Method */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'upi', 'other'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('method', m)}
                className={`
                  py-2.5 text-xs font-bold rounded-chip border text-center transition-all select-none cursor-pointer uppercase tracking-wider
                  ${method === m ? 'bg-accent text-text-on-accent border-transparent shadow-cta' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Note & Date */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Optional Note"
            type="text"
            placeholder="Cash handed over"
            error={errors.note?.message}
            {...register('note')}
          />
          <Input
            label="Payment Date"
            type="date"
            error={errors.date?.message}
            prefixIcon={<Calendar className="w-4 h-4" />}
            required
            {...register('date')}
          />
        </div>

        <div className="flex gap-2.5 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={onCancel} disabled={createSettlementMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createSettlementMutation.isPending}
            className="font-semibold"
          >
            Log Payment
          </Button>
        </div>
      </form>

      {/* Overpayment Warning Dialog */}
      <Modal
        isOpen={isOverpaymentModalOpen}
        onClose={() => setIsOverpaymentModalOpen(false)}
        title="Warning: Overpayment Detected"
        confirmLabel="Continue"
        cancelLabel="Adjust Amount"
        onConfirm={() => saveSettlement(pendingParams)}
        isConfirmLoading={createSettlementMutation.isPending}
        variant="danger"
      >
        <div className="flex flex-col gap-3 font-sans text-xs">
          <div className="flex items-start gap-2.5 p-3 bg-error/10 border border-error/20 rounded-chip text-error">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-normal font-semibold">
              This amount is larger than what is currently outstanding!
            </p>
          </div>
          {pendingParams && (
            balanceDirection === 'owes_me' ? (
              <p className="leading-relaxed text-text-secondary">
                This is more than <strong className="text-text-primary">{personName}</strong> owes you. Balance will flip to you owing them <strong className="text-text-primary">{formatCurrency(pendingParams.amount_paise - Math.abs(netBalancePaise))}</strong>.
              </p>
            ) : (
              <p className="leading-relaxed text-text-secondary">
                This is more than you owe <strong className="text-text-primary">{personName}</strong>. Balance will flip to them owing you <strong className="text-text-primary">{formatCurrency(pendingParams.amount_paise - Math.abs(netBalancePaise))}</strong>.
              </p>
            )
          )}
          <p className="leading-relaxed font-medium">Are you sure you want to proceed?</p>
        </div>
      </Modal>
    </>
  )
}
