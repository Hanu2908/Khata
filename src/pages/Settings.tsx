import React, { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/useUIStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, CreditCard, Moon, Sun, LogOut, Check, Coffee, AlertCircle } from 'lucide-react'

export default function Settings() {
  const isDark = useUIStore((s) => s.isDark)
  const toggleDark = useUIStore((s) => s.toggleDark)

  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setName(profile.name || '')
          setUpiId(profile.upi_id || '')
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError('')
    setSuccess(false)
    setIsUpdating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: name.trim(),
        upi_id: upiId.trim() || null,
      })

      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut()
    }
  }

  return (
    <PageWrapper title="Settings" showBackButton={false} showNav={true}>
      <div className="flex flex-col gap-6">
        
        {/* Profile Card Form */}
        <div className="flex flex-col gap-3.5 bg-card border border-border rounded-card p-5 shadow-card font-sans">
          <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-secondary">
            User Profile
          </h3>

          {isLoading ? (
            <div className="h-44 bg-divider/30 animate-pulse rounded-chip" />
          ) : (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-positive/10 border border-positive/20 rounded-chip text-positive text-[12px] font-semibold leading-relaxed flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <Input
                label="Display Name"
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                prefixIcon={<User className="w-4.5 h-4.5" />}
                required
              />

              <Input
                label="UPI ID"
                type="text"
                placeholder="rahul@oksbi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                prefixIcon={<CreditCard className="w-4.5 h-4.5" />}
                helperText="For receiving payments from shared links."
              />

              <Button type="submit" variant="primary" fullWidth isLoading={isUpdating} className="mt-1">
                Save Profile
              </Button>
            </form>
          )}
        </div>

        {/* Preferences & General */}
        <div className="flex flex-col gap-1.5 bg-card border border-border rounded-card shadow-card overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-secondary">
              Preferences
            </h3>
          </div>

          <div className="flex flex-col divide-y divide-divider font-sans">
            {/* Theme Toggle Row */}
            <button
              onClick={toggleDark}
              className="flex items-center justify-between px-5 py-4 hover:bg-divider/10 transition-colors text-left select-none cursor-pointer w-full"
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-accent" />
                ) : (
                  <Sun className="w-5 h-5 text-accent" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Dark Mode</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Adjust how the app looks on your device</p>
                </div>
              </div>
              <div className="w-10 h-6 bg-divider rounded-full relative p-0.5 transition-colors cursor-pointer border border-border">
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-accent transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </div>
            </button>

            {/* Buy Me a Chai Row */}
            <a
              href="https://buy.stripe.com/mock-chai"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault()
                alert('Thank you! This is a V1 demo. No real payment will be processed. Keep supporting!')
              }}
              className="flex items-center gap-3 px-5 py-4 hover:bg-divider/10 transition-colors text-left select-none cursor-pointer w-full text-text-primary"
            >
              <Coffee className="w-5 h-5 text-positive" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Buy me a chai</h4>
                <p className="text-xs text-text-secondary mt-0.5">Support first-year student builders</p>
              </div>
            </a>

            {/* Logout Row */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-5 py-4 hover:bg-error/5 hover:text-error transition-colors text-left select-none cursor-pointer w-full text-text-secondary"
            >
              <LogOut className="w-5 h-5 text-error/80" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary hover:text-error">Log Out</h4>
                <p className="text-xs text-text-secondary mt-0.5">Sign out of your account on this device</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
