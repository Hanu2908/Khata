import React, { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useGroups, useCreateGroup, useDeleteGroup } from '@/hooks/useGroups'
import { usePersons } from '@/hooks/usePersons'
import { useTransactionPersons } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/balance'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Chip } from '@/components/ui/Chip'
import { GroupsEmptyIllustration } from '@/components/ui/illustrations/GroupsEmptyIllustration'
import { Users, Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react'

export default function Groups() {
  const { data: groups, isLoading: isGroupsLoading } = useGroups()
  const { data: persons } = usePersons()
  const { data: txPersons, isLoading: isTxPersonsLoading } = useTransactionPersons()
  
  const createGroupMutation = useCreateGroup()
  const deleteGroupMutation = useDeleteGroup()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      setError('Group name is required')
      return
    }

    setError('')
    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        personIds: selectedPersonIds,
      })
      setGroupName('')
      setSelectedPersonIds([])
      setIsSheetOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create group')
    }
  }

  const toggleSelectPerson = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Are you sure you want to delete this group? The friends in it will not be deleted.')) {
      await deleteGroupMutation.mutate(id)
    }
  }

  const computeGroupBalance = (groupId: string) => {
    if (!txPersons) return 0
    return txPersons
      .filter((tp) => tp.transactions?.group_id === groupId)
      .reduce((sum, tp) => {
        if (tp.direction === 'owes_me') {
          return sum + tp.share_amount_paise
        } else if (tp.direction === 'i_owe') {
          return sum - tp.share_amount_paise
        }
        return sum
      }, 0)
  }

  const isLoading = isGroupsLoading || isTxPersonsLoading

  return (
    <PageWrapper
      title="Groups"
      showBackButton={false}
      showNav={true}
      rightAction={
        <Button
          variant="ghost"
          size="sm"
          className="text-accent hover:bg-divider/50 flex items-center gap-1.5"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Create
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        
        {/* Helper Banner */}
        <div className="p-4 bg-hero text-text-on-hero rounded-hero shadow-card flex items-start gap-3 select-none">
          <div className="p-2 bg-accent/20 text-accent rounded-chip shrink-0 mt-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[-0.1px]">Groups Splits</span>
            <span className="text-xs text-text-on-hero/70 leading-relaxed mt-1 font-sans">
              Create groups to split expenses (like hostel rent, auto, or dinners) equally among members in a single tap.
            </span>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-secondary">
            Your Groups
          </h3>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full h-24 bg-card border border-divider animate-pulse rounded-card" />
            ))
          ) : groups && groups.length > 0 ? (
            groups.map((group) => {
              const members = group.group_persons.map((gp) => gp.persons)
              const memberNames = members
                .map((m) => m ? (m.label || m.name) : '')
                .filter(Boolean)
                .join(', ')

              const groupBalance = computeGroupBalance(group.id)

              return (
                <div
                  key={group.id}
                  className="flex items-start justify-between p-4 bg-card border border-divider rounded-card shadow-card select-none"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-3">
                    <span className="text-[15px] font-semibold text-text-primary tracking-[-0.1px] leading-tight">
                      {group.name}
                    </span>
                    <span className="text-xs text-text-secondary truncate font-sans">
                      {members.length > 0
                        ? `${members.length} member${members.length > 1 ? 's' : ''}: ${memberNames}`
                        : 'No members added yet'}
                    </span>
                    <span className={`text-[12px] font-semibold mt-1 font-sans ${
                      groupBalance > 0 ? 'text-positive' : groupBalance < 0 ? 'text-negative' : 'text-text-tertiary'
                    }`}>
                      {groupBalance > 0 
                        ? `You are owed ${formatCurrency(groupBalance)}` 
                        : groupBalance < 0 
                        ? `You owe ${formatCurrency(Math.abs(groupBalance))}` 
                        : 'Settled up'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer shrink-0"
                    aria-label="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-divider rounded-card text-center gap-4 font-sans select-none shadow-card">
              <div className="w-24 h-24 flex items-center justify-center">
                <GroupsEmptyIllustration />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-medium text-text-primary text-[16px] leading-tight">
                  No groups yet
                </h4>
                <p className="text-[13px] text-text-secondary max-w-[260px] leading-normal">
                  Create a group for your hostel wing, trip, or friend circle.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSheetOpen(true)}
                className="font-semibold px-5 py-2.5 text-xs shadow-cta cursor-pointer select-none active:scale-[0.98] transition-all"
              >
                Create a group
              </Button>
            </div>
          )}
        </div>

        {/* Create Group Bottom Sheet */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false)
            setGroupName('')
            setSelectedPersonIds([])
            setError('')
          }}
          title="Create New Group"
        >
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4 font-sans">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <Input
              label="Group Name"
              type="text"
              placeholder="Hostel Room 302"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none">
                Select Members
              </label>

              {persons && persons.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-border rounded-chip bg-card">
                  {persons.map((person) => {
                    const isSelected = selectedPersonIds.includes(person.id)
                    const displayName = person.label || person.name
                    return (
                      <Chip
                        key={person.id}
                        label={displayName}
                        isActive={isSelected}
                        onClick={() => toggleSelectPerson(person.id)}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 border border-divider rounded-chip text-center text-xs text-text-tertiary bg-card">
                  Add friends in the home screen first to select them as group members.
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={createGroupMutation.isPending}
              className="mt-2"
            >
              Save Group
            </Button>
          </form>
        </BottomSheet>
      </div>
    </PageWrapper>
  )
}
