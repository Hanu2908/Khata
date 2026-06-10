import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { supabase } from '@/lib/supabase'

// Extracted Forms
import { DirectIOUForm } from '@/components/forms/DirectIOUForm'
import { GroupSplitForm } from '@/components/forms/GroupSplitForm'

export default function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Extract transaction type: 'direct' or 'group_split'
  const initialType = (searchParams.get('type') as 'direct' | 'group_split') || 'direct'
  const [txType, setTxType] = useState<'direct' | 'group_split'>(initialType)

  const personIdParam = searchParams.get('personId') || undefined
  const editId = searchParams.get('edit')

  const [initialTxData, setInitialTxData] = useState<any>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Load transaction details if in edit mode
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true)
      supabase
        .from('transactions')
        .select(`
          *,
          transaction_persons (
            person_id,
            share_amount_paise,
            direction
          )
        `)
        .eq('id', editId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setInitialTxData({
              id: data.id,
              amount_paise: data.amount_paise,
              note: data.note,
              date: data.date,
              paid_by: data.paid_by,
              personId: data.transaction_persons?.[0]?.person_id || '',
            })
            setTxType('direct') // Edit mode is direct only
          }
          setLoadingEdit(false)
        })
    }
  }, [editId])

  if (loadingEdit) {
    return (
      <PageWrapper>
        <div className="animate-pulse flex flex-col gap-4 mt-4 font-sans">
          <div className="h-10 bg-border rounded-chip w-32" />
          <div className="h-12 bg-border rounded-chip w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-border rounded-chip" />
            <div className="h-12 bg-border rounded-chip" />
          </div>
          <div className="h-32 bg-border rounded-card w-full" />
        </div>
      </PageWrapper>
    )
  }

  const titleText = editId 
    ? 'Edit Entry' 
    : `Log ${txType === 'direct' ? 'Gave / Took' : 'Group Split'}`

  return (
    <PageWrapper>
      {/* Header Back Link */}
      <div className="flex items-center gap-3 mb-6 select-none font-sans">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          {titleText}
        </h1>
      </div>

      <div className="flex flex-col gap-5">
        {/* Toggle Entry Type (Only visible when not editing) */}
        {!editId && (
          <div className="flex bg-divider/40 p-0.5 rounded-chip border border-divider/60 font-sans">
            <button
              type="button"
              onClick={() => setTxType('direct')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${txType === 'direct' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setTxType('group_split')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${txType === 'group_split' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Group Split
            </button>
          </div>
        )}

        {/* Form Container */}
        {txType === 'direct' ? (
          <DirectIOUForm
            initialValues={initialTxData}
            lockedPersonId={personIdParam}
            onSuccess={() => navigate('/home')}
            onCancel={() => navigate('/home')}
          />
        ) : (
          <GroupSplitForm
            onSuccess={() => navigate('/home')}
            onCancel={() => navigate('/home')}
          />
        )}
      </div>
    </PageWrapper>
  )
}
