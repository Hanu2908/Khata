import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { usePersons, useCreatePerson } from '@/hooks/usePersons'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useGroups } from '@/hooks/useGroups'
import { equalSplit, formatCurrency } from '@/lib/balance'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ArrowLeft, Plus, Users, User, ArrowUpRight, ArrowDownLeft, Calendar, AlertTriangle, Check, ShieldAlert } from 'lucide-react'

export default function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Extract transaction type: 'direct' or 'group_split'
  const initialType = (searchParams.get('type') as 'direct' | 'group_split') || 'direct'
  const [txType, setTxType] = useState<'direct' | 'group_split'>(initialType)

  const { data: persons, isLoading: isPersonsLoading } = usePersons()
  const { data: groups } = useGroups()
  
  const createPersonMutation = useCreatePerson()
  const createTxMutation = useCreateTransaction()

  // Form Fields
  const [amountRupees, setAmountRupees] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [payer, setPayer] = useState<'me' | 'them'>('me') // Who paid
  
  // For Direct IOU
  const [selectedPersonId, setSelectedPersonId] = useState('')

  // For Group Split
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([])
  const [groupPayerId, setGroupPayerId] = useState('') // If 'them' paid, which person paid

  // Inline Contact Creation State
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonLabel, setNewPersonLabel] = useState('')
  const [newPersonPhone, setNewPersonPhone] = useState('')
  const [newPersonUpi, setNewPersonUpi] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [duplicatePerson, setDuplicatePerson] = useState<any>(null)
  const [personError, setPersonError] = useState('')

  // Auto-prefill group members when group is selected
  useEffect(() => {
    if (txType === 'group_split' && selectedGroupId && groups) {
      const group = groups.find((g) => g.id === selectedGroupId)
      if (group) {
        const memberIds = group.group_persons.map((gp) => gp.person_id)
        setSelectedPersonIds(memberIds)
        // Reset group payer if they are not in the new group
        if (groupPayerId && !memberIds.includes(groupPayerId)) {
          setGroupPayerId('')
        }
      }
    }
  }, [selectedGroupId, groups, txType])

  // Split preview calculations
  const calculateSplitsPreview = () => {
    const amountVal = parseFloat(amountRupees)
    if (isNaN(amountVal) || amountVal <= 0) return []

    const amountPaise = Math.round(amountVal * 100)

    if (txType === 'direct') {
      const person = persons?.find((p) => p.id === selectedPersonId)
      if (!person) return []

      return [
        {
          name: person.label || person.name,
          sharePaise: amountPaise,
          direction: payer === 'me' ? 'owes_me' : 'i_owe',
        },
      ]
    } else {
      // Group Split
      const totalPeople = selectedPersonIds.length + 1 // friends + Me
      if (totalPeople <= 1) return []

      const shares = equalSplit(amountPaise, totalPeople)

      if (payer === 'me') {
        // I paid: each selected friend owes me their share
        return selectedPersonIds.map((pid, idx) => {
          const person = persons?.find((p) => p.id === pid)
          return {
            name: person ? (person.label || person.name) : 'Unknown',
            sharePaise: shares[idx + 1], // first share is mine
            direction: 'owes_me',
          }
        })
      } else {
        // A friend paid (groupPayerId)
        const payerPerson = persons?.find((p) => p.id === groupPayerId)
        if (!payerPerson) return []

        // I owe the payer my share
        return [
          {
            name: payerPerson.label || payerPerson.name,
            sharePaise: shares[0], // my share
            direction: 'i_owe',
          },
        ]
      }
    }
  }

  const splitsPreview = calculateSplitsPreview()

  // Handle contact creation with duplicate checking
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setPersonError('')

    const nameClean = newPersonName.trim()
    if (!nameClean) {
      setPersonError('Name is required')
      return
    }

    // Check duplicates
    const dup = persons?.find(
      (p) => p.name.toLowerCase() === nameClean.toLowerCase()
    )

    if (dup && !duplicateWarning) {
      // Prompt warning, force label entry
      setDuplicatePerson(dup)
      setDuplicateWarning(true)
      setPersonError(
        `You already have someone named "${nameClean}". Add a label (e.g. Hostel, CS) to distinguish them.`
      )
      return
    }

    if (duplicateWarning && !newPersonLabel.trim()) {
      setPersonError('Label is required to resolve name conflict.')
      return
    }

    try {
      const newContact = await createPersonMutation.mutateAsync({
        name: nameClean,
        label: newPersonLabel.trim() || null,
        phone: newPersonPhone.trim() || null,
        upi_id: newPersonUpi.trim() || null,
      })

      // Auto-select newly created person
      if (txType === 'direct') {
        setSelectedPersonId(newContact.id)
      } else {
        setSelectedPersonIds((prev) => [...prev, newContact.id])
      }

      // Reset contact creation form
      setNewPersonName('')
      setNewPersonLabel('')
      setNewPersonPhone('')
      setNewPersonUpi('')
      setDuplicateWarning(false)
      setDuplicatePerson(null)
      setIsAddingPerson(false)
    } catch (err: any) {
      setPersonError(err.message || 'Failed to add contact')
    }
  }

  // Handle transaction submission
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountVal = parseFloat(amountRupees)
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const amountPaise = Math.round(amountVal * 100)

    // Validation
    if (txType === 'direct') {
      if (!selectedPersonId) {
        alert('Please select a friend')
        return
      }
    } else {
      if (selectedPersonIds.length === 0) {
        alert('Please select at least one friend to split with')
        return
      }
      if (payer === 'them' && !groupPayerId) {
        alert('Please select who paid')
        return
      }
      if (payer === 'them' && !selectedPersonIds.includes(groupPayerId)) {
        alert('The payer must be part of the split group')
        return
      }
    }

    // Construct Splits Array
    let splits: any[] = []

    if (txType === 'direct') {
      splits = [
        {
          person_id: selectedPersonId,
          share_amount_paise: amountPaise,
          direction: payer === 'me' ? 'owes_me' : 'i_owe',
        },
      ]
    } else {
      // Group Split equal shares
      const totalPeople = selectedPersonIds.length + 1
      const shares = equalSplit(amountPaise, totalPeople)

      if (payer === 'me') {
        // I paid: each friend gets a share, direction is owes_me. Payer (me) gets no row.
        splits = selectedPersonIds.map((pid, idx) => ({
          person_id: pid,
          share_amount_paise: shares[idx + 1],
          direction: 'owes_me',
        }))
      } else {
        // A friend paid (groupPayerId): I owe them my share.
        // Payer gets no row? Wait, Rahul paid, so Rahul gets a row with 'i_owe' and my share!
        // The other non-payers get no row.
        splits = [
          {
            person_id: groupPayerId,
            share_amount_paise: shares[0], // my share
            direction: 'i_owe',
          },
        ]
      }
    }

    try {
      await createTxMutation.mutateAsync({
        paid_by: payer,
        amount_paise: amountPaise,
        note: note.trim() || null,
        date,
        type: txType,
        group_id: txType === 'group_split' ? (selectedGroupId || null) : null,
        splits,
      })

      navigate('/')
    } catch (err: any) {
      alert(err.message || 'Failed to save transaction')
    }
  }

  return (
    <PageWrapper
      title={`Log ${txType === 'direct' ? 'Direct IOU' : 'Group Split'}`}
      showBackButton={true}
      showNav={false}
      onBackClick={() => navigate('/')}
    >
      <div className="flex flex-col gap-5">
        
        {/* Toggle Entry Type */}
        <div className="flex bg-divider/40 p-0.5 rounded-chip border border-divider/60 font-sans">
          <button
            type="button"
            onClick={() => {
              setTxType('direct')
              setSelectedPersonIds([])
              setGroupPayerId('')
            }}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${txType === 'direct' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
          >
            Direct IOU
          </button>
          <button
            type="button"
            onClick={() => {
              setTxType('group_split')
              setSelectedPersonId('')
            }}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${txType === 'group_split' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
          >
            Group Split
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4 font-sans">
          
          {/* Amount Box */}
          <Input
            label="Total Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            prefixText="₹"
            required
          />

          {/* Note & Date */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Note/Description"
              type="text"
              placeholder="Chai, lunch, auto..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
            <Input
              label="Transaction Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              prefixIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          {/* Payer Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Who Paid?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPayer('me')
                  if (txType === 'group_split') setGroupPayerId('')
                }}
                className={`
                  py-2.5 text-xs font-semibold rounded-chip border text-center transition-all select-none cursor-pointer
                  ${payer === 'me' ? 'bg-accent text-white border-transparent shadow-sm' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                `}
              >
                I Paid
              </button>
              <button
                type="button"
                onClick={() => setPayer('them')}
                className={`
                  py-2.5 text-xs font-semibold rounded-chip border text-center transition-all select-none cursor-pointer
                  ${payer === 'them' ? 'bg-accent text-white border-transparent shadow-sm' : 'bg-card border-border text-text-secondary hover:text-text-primary'}
                `}
              >
                They Paid
              </button>
            </div>
          </div>

          {/* 1. If Direct IOU Page Layout */}
          {txType === 'direct' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Select Friend
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingPerson(true)}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Friend
                </button>
              </div>

              {isPersonsLoading ? (
                <div className="h-10 bg-divider/30 animate-pulse rounded-chip" />
              ) : persons && persons.length > 0 ? (
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full bg-card text-text-primary border border-border rounded-chip px-3.5 py-3 text-sm outline-none focus:border-text-secondary font-medium"
                  required
                >
                  <option value="">-- Choose Contact --</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.label || person.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 border border-dashed border-border rounded-chip text-center text-xs text-text-tertiary">
                  No friends added yet. Click Add Friend above.
                </div>
              )}
            </div>
          )}

          {/* 2. If Group Split Page Layout */}
          {txType === 'group_split' && (
            <div className="flex flex-col gap-4">
              
              {/* Optional Group Selector */}
              {groups && groups.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Select Group (Optional)
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-card text-text-primary border border-border rounded-chip px-3.5 py-3 text-sm outline-none focus:border-text-secondary font-medium"
                  >
                    <option value="">-- Select Pre-saved Group --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Members Checklist */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Split with (Select Friends)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingPerson(true)}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Friend
                  </button>
                </div>

                {persons && persons.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2 border border-border rounded-chip bg-card max-h-[120px] overflow-y-auto">
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
                            ${isSelected ? 'bg-accent/15 text-accent border-accent/30' : 'bg-divider/30 border-divider text-text-secondary hover:text-text-primary'}
                          `}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {displayName}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-border rounded-chip text-center text-xs text-text-tertiary">
                    No friends available to split. Add one.
                  </div>
                )}
              </div>

              {/* Select Payer (If they paid) */}
              {payer === 'them' && selectedPersonIds.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Which Friend Paid?
                  </label>
                  <select
                    value={groupPayerId}
                    onChange={(e) => setGroupPayerId(e.target.value)}
                    className="w-full bg-card text-text-primary border border-border rounded-chip px-3.5 py-3 text-sm outline-none focus:border-text-secondary font-medium"
                    required
                  >
                    <option value="">-- Choose Payer --</option>
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
            </div>
          )}

          {/* Equal Split preview */}
          {splitsPreview.length > 0 && (
            <div className="p-4 bg-card border border-divider rounded-card flex flex-col gap-3">
              <span className="text-xs font-semibold text-text-primary uppercase tracking-[0.08em] flex items-center gap-1.5 border-b border-divider pb-2">
                <Users className="w-4 h-4 text-accent" />
                Equal Split Preview
              </span>
              <div className="flex flex-col gap-2 font-sans text-xs">
                {splitsPreview.map((split, i) => (
                  <div key={i} className="flex justify-between items-center text-text-secondary py-0.5">
                    <span className="font-semibold text-text-primary">{split.name}</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={split.direction === 'owes_me' ? 'text-positive' : 'text-accent'}>
                        {split.direction === 'owes_me' ? 'owes you' : 'you owe'}
                      </span>
                      <span className="font-bold text-text-primary">{formatCurrency(split.sharePaise)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createTxMutation.isPending}
            className="mt-4"
          >
            Save Transaction
          </Button>

        </form>
      </div>

      {/* Add Person Bottom Sheet */}
      <BottomSheet
        isOpen={isAddingPerson}
        onClose={() => {
          setIsAddingPerson(false)
          setNewPersonName('')
          setNewPersonLabel('')
          setNewPersonPhone('')
          setNewPersonUpi('')
          setDuplicateWarning(false)
          setDuplicatePerson(null)
          setPersonError('')
        }}
        title="Add New Contact"
      >
        <form onSubmit={handleCreateContact} className="flex flex-col gap-4 font-sans">
          
          {personError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{personError}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-chip flex flex-col gap-1.5">
              <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Duplicate Contact Name
              </span>
              <p className="text-[12px] text-text-secondary leading-normal">
                You already have a contact named <strong className="text-text-primary">"{duplicatePerson?.name}"</strong> {duplicatePerson?.label ? `(${duplicatePerson.label})` : ''} in your ledger.
              </p>
              <p className="text-[11px] text-text-tertiary">
                Please provide a label (e.g. Hostel, Class, Roll No) to distinguish them.
              </p>
            </div>
          )}

          <Input
            label="Contact Real Name"
            type="text"
            placeholder="Rahul Sharma"
            value={newPersonName}
            onChange={(e) => {
              setNewPersonName(e.target.value)
              if (duplicateWarning) {
                setDuplicateWarning(false)
                setDuplicatePerson(null)
                setPersonError('')
              }
            }}
            required
          />

          <Input
            label={duplicateWarning ? "Label (FORCED - e.g. Hostel)" : "Label (Optional)"}
            type="text"
            placeholder="Room 302 / CS Dept"
            value={newPersonLabel}
            onChange={(e) => setNewPersonLabel(e.target.value)}
            required={duplicateWarning}
            helperText="Helps identify which friend this is."
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="+91 9876543210"
            value={newPersonPhone}
            onChange={(e) => setNewPersonPhone(e.target.value)}
          />

          <Input
            label="UPI ID (Optional)"
            type="text"
            placeholder="rahul@oksbi"
            value={newPersonUpi}
            onChange={(e) => setNewPersonUpi(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createPersonMutation.isPending}
            className="mt-2"
          >
            Create Contact
          </Button>

        </form>
      </BottomSheet>

    </PageWrapper>
  )
}
