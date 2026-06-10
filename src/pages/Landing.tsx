import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sparkles, Calculator } from 'lucide-react'
import { equalSplit, formatCurrency } from '@/lib/balance'

// Sub-components
import { LandingHero } from '@/components/landing/LandingHero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { WhyYaariKhaatha } from '@/components/landing/WhyYaariKhaatha'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Landing() {
  const navigate = useNavigate()
  
  // Guest redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home', { replace: true })
      }
    })
  }, [navigate])

  // Split Sandbox State
  const [amountInput, setAmountInput] = useState('120')
  const [peopleInput, setPeopleInput] = useState('3')
  const [sandboxResult, setSandboxResult] = useState<{
    shares: number[]
    totalCalculated: number
  } | null>({
    shares: [4000, 4000, 4000],
    totalCalculated: 12000
  })
  const [sandboxError, setSandboxError] = useState('')

  const handleCalculateSplit = (e: React.FormEvent) => {
    e.preventDefault()
    setSandboxError('')

    const rupees = parseFloat(amountInput)
    const count = parseInt(peopleInput)

    if (isNaN(rupees) || rupees <= 0) {
      setSandboxError('Please enter a valid amount greater than ₹0')
      setSandboxResult(null)
      return
    }
    if (isNaN(count) || count < 2) {
      setSandboxError('Please enter at least 2 people to split')
      setSandboxResult(null)
      return
    }
    if (count > 50) {
      setSandboxError('Maximum limit for sandbox is 50 people')
      setSandboxResult(null)
      return
    }

    const paise = Math.round(rupees * 100)
    const splits = equalSplit(paise, count)
    const sum = splits.reduce((a, b) => a + b, 0)

    setSandboxResult({
      shares: splits,
      totalCalculated: sum
    })
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col font-sans transition-colors duration-200">
      
      {/* Header */}
      <header className="w-full border-b border-border bg-card/85 backdrop-blur-[6px] sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div className="w-9 h-9 rounded-hero bg-accent text-text-on-accent flex items-center justify-center shadow-cta">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary">
              Yaari Khaatha
            </span>
          </div>

          {/* M3 Resolution: Both Log In and Sign Up buttons in Landing Navbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary px-3 py-2 rounded-chip transition-colors cursor-pointer"
            >
              Log In
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              className="cursor-pointer font-bold text-xs"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section (incorporates AppPreview) */}
      <LandingHero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Why Yaari Khaatha Section */}
      <WhyYaariKhaatha />

      {/* Sandbox Section */}
      <section id="sandbox" className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-16 lg:py-24 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Info Column */}
          <div className="lg:col-span-5 flex flex-col gap-5 text-left">
            <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-accent">Interactive Sandbox</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Try the Paise-Accurate Split Arithmetic
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              We never use floating point decimals. We perform all splits using safe integer arithmetic in paise, preventing rounding leakages.
            </p>
            <div className="flex flex-col gap-3.5 bg-card border border-divider p-5 rounded-hero text-xs mt-2 text-text-secondary leading-relaxed">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <Calculator className="w-4 h-4" />
                <span>Integer Split Rule:</span>
              </div>
              <p>
                When splitting amount $X$ among $N$ friends, the remainder is distributed $1$ paisa at a time to the first $R$ participants. The sum of split shares always equals the total amount exactly.
              </p>
            </div>
          </div>

          {/* Calculator Column */}
          <div className="lg:col-span-7 bg-card border border-border rounded-hero shadow-card p-6">
            <form onSubmit={handleCalculateSplit} className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Quick Split Sandbox</h4>
              
              {sandboxError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-chip font-semibold">
                  {sandboxError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Total Amount (₹)"
                  type="number"
                  step="0.01"
                  placeholder="120.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                />
                <Input
                  label="Number of People"
                  type="number"
                  min="2"
                  max="50"
                  placeholder="3"
                  value={peopleInput}
                  onChange={(e) => setPeopleInput(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="secondary" fullWidth className="py-3 mt-1 cursor-pointer font-semibold">
                Split Equally
              </Button>
            </form>

            {/* Results Grid */}
            {sandboxResult && (
              <div className="mt-6 border-t border-divider pt-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-bg/50 px-4 py-2.5 rounded-chip border border-divider text-xs">
                  <span className="font-semibold text-text-secondary">Total Sandbox Sum:</span>
                  <span className="font-bold text-text-primary text-sm">
                    {formatCurrency(sandboxResult.totalCalculated)}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Share Breakdown:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {sandboxResult.shares.map((paiseShare, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-bg/30 border border-divider/60 rounded-card">
                        <span className="text-xs text-text-secondary font-medium">Friend {idx + 1}</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-semibold text-text-primary">{formatCurrency(paiseShare)}</span>
                          <span className="text-[9px] text-text-tertiary">({paiseShare} paise)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="w-full bg-hero text-text-on-hero py-16 text-center select-none relative overflow-hidden transition-colors duration-200">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-accent/15 rounded-full blur-[100px]" />
        <div className="max-w-2xl mx-auto px-4 relative z-10 flex flex-col gap-6 items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Stop chasing roommates for bills.
          </h2>
          <p className="text-xs sm:text-sm text-text-on-hero/70 max-w-md">
            Log balances in seconds, copy the shareable summary message, send via WhatsApp, and get paid back via UPI deep-links instantly.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className="px-8 mt-2 cursor-pointer"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
