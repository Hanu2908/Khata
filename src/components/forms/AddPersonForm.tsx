import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePersons, useCreatePerson } from '@/hooks/usePersons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ShieldAlert, AlertTriangle } from 'lucide-react'

const personSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  label: z.string().max(30, 'Label is too long').optional(),
  phone: z.string().optional(),
  upi_id: z.string().optional(),
})

type PersonFormValues = z.infer<typeof personSchema>

interface AddPersonFormProps {
  onSuccess: (newContact: any) => void
  onCancel?: () => void
}

export const AddPersonForm: React.FC<AddPersonFormProps> = ({ onSuccess, onCancel }) => {
  const { data: persons } = usePersons()
  const createPersonMutation = useCreatePerson()
  
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [duplicatePerson, setDuplicatePerson] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: '',
      label: '',
      phone: '',
      upi_id: '',
    }
  })

  const nameVal = watch('name')

  const onSubmit = async (values: PersonFormValues) => {
    setErrorMessage('')
    const nameClean = values.name.trim()

    // 9. Person Identity & Duplicate Management
    const dup = persons?.find(
      (p) => p.name.toLowerCase() === nameClean.toLowerCase()
    )

    if (dup && !duplicateWarning) {
      setDuplicatePerson(dup)
      setDuplicateWarning(true)
      setErrorMessage(`You already have a friend named "${nameClean}". A label is required to save this entry.`)
      return
    }

    if (duplicateWarning && !values.label?.trim()) {
      setErrorMessage('A label (e.g. Hostel, CS) is required to resolve this name conflict.')
      return
    }

    try {
      const newContact = await createPersonMutation.mutateAsync({
        name: nameClean,
        label: values.label?.trim() || null,
        phone: values.phone?.trim() || null,
        upi_id: values.upi_id?.trim() || null,
      })
      onSuccess(newContact)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create friend.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 font-sans text-left">
      {errorMessage && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-chip flex flex-col gap-1">
          <span className="text-[12px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Duplicate Name Detected
          </span>
          <p className="text-[11px] text-text-secondary leading-normal">
            A friend named <strong className="text-text-primary">"{duplicatePerson?.name}"</strong> {duplicatePerson?.label ? `(${duplicatePerson.label})` : ''} already exists. 
            Provide a label below to save them.
          </p>
        </div>
      )}

      <Input
        label="Name"
        type="text"
        placeholder="Rahul Sharma"
        error={errors.name?.message}
        required
        {...register('name', {
          onChange: () => {
            if (duplicateWarning) {
              setDuplicateWarning(false)
              setDuplicatePerson(null)
              setErrorMessage('')
            }
          }
        })}
      />

      <Input
        label={duplicateWarning ? "Label (Forced - e.g. Hostel)" : "Label (Optional)"}
        type="text"
        placeholder="CS / Hostel / Gym"
        error={errors.label?.message}
        required={duplicateWarning}
        helperText="Helps you identify which friend this is."
        {...register('label')}
      />

      <Input
        label="Phone Number (Optional)"
        type="tel"
        placeholder="+91 98765 43210"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label="UPI ID (Optional)"
        type="text"
        placeholder="rahul@oksbi"
        error={errors.upi_id?.message}
        {...register('upi_id')}
      />

      <div className="flex gap-2.5 mt-2">
        {onCancel && (
          <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={createPersonMutation.isPending}
          className="font-semibold"
        >
          Create Contact
        </Button>
      </div>
    </form>
  )
}
