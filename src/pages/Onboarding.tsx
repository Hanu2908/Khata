import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sparkles, User, CreditCard } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        // Check if profile exists and prefill name
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setName(profile.name || '')
          setUpiId(profile.upi_id || '')
        } else {
          // Fallback to Google metadata if no profile row was inserted yet
          const fullName = user.user_metadata?.full_name || splitEmail(user.email || '')
          setName(fullName)
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const splitEmail = (email: string) => {
    return email.split('@')[0]
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError('')
    setIsUpdating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert profile
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: name.trim(),
        upi_id: upiId.trim() || null,
      })

      if (upsertError) throw upsertError

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSkip = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-full" />
          <span className="text-xs text-text-secondary font-medium">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-hero shadow-card p-6 flex flex-col gap-6">
        
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-1.5 mt-2">
          <div className="w-12 h-12 rounded-hero bg-accent text-white flex items-center justify-center shadow-cta">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary mt-2">
            Welcome to Yaari Khaatha
          </h1>
          <p className="text-[12px] text-text-secondary max-w-[280px]">
            Set up your profile to start tracking splits.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <Input
            label="Your Display Name"
            type="text"
            placeholder="Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            prefixIcon={<User className="w-4.5 h-4.5" />}
            required
          />

          <Input
            label="Your UPI ID (Optional)"
            type="text"
            placeholder="rahul@oksbi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            prefixIcon={<CreditCard className="w-4.5 h-4.5" />}
            helperText="Used on share links so friends can pay you instantly."
          />

          <div className="flex flex-col gap-2.5 mt-4">
            <Button type="submit" variant="primary" fullWidth isLoading={isUpdating}>
              Get Started
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleSkip}
              disabled={isUpdating}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
