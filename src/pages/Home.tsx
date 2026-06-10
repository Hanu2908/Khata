import React, { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { HeroCard } from '@/components/ledger/HeroCard'
import { PersonCard } from '@/components/ledger/PersonCard'
import { useBalance } from '@/hooks/useBalance'
import { useProfile } from '@/hooks/useProfile'
import { useUIStore } from '@/store/useUIStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { HomeEmptyIllustration } from '@/components/ui/illustrations/HomeEmptyIllustration'
import { Search, Users, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react'

export default function Home() {
  const { balances, peopleOweMeTotalPaise, iOwePeopleTotalPaise, isLoading, isError, error, refetch } = useBalance()
  const { data: profile } = useProfile()
  const isUpiNudgeDismissed = useUIStore((s) => s.isUpiNudgeDismissed)
  const dismissUpiNudge = useUIStore((s) => s.dismissUpiNudge)
  const setFabPulsed = useUIStore((s) => s.setFabPulsed)
  const openSheet = useUIStore((s) => s.openSheet)

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'owes_me' | 'i_owe'>('all')
  const [showSettled, setShowSettled] = useState(false)

  const isInitialEmpty = !isLoading && balances.length === 0

  useEffect(() => {
    if (isInitialEmpty) {
      const timer = setTimeout(() => {
        setFabPulsed(true)
      }, 5000) // Pulse for 5s initially, then disable
      return () => clearTimeout(timer)
    }
  }, [isInitialEmpty, setFabPulsed])

  const filteredBalances = balances.filter((person) => {
    // Search filter
    const matchesSearch =
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.label && person.label.toLowerCase().includes(searchQuery.toLowerCase()))

    // Tab filter
    if (filter === 'all') return matchesSearch
    if (filter === 'owes_me') return matchesSearch && person.netBalancePaise > 0
    if (filter === 'i_owe') return matchesSearch && person.netBalancePaise < 0
    return false
  })

  // Separate active and settled balances when on "All" tab
  const activeBalances = filter === 'all'
    ? filteredBalances.filter((p) => p.netBalancePaise !== 0)
    : filteredBalances

  const settledBalances = filter === 'all'
    ? filteredBalances.filter((p) => p.netBalancePaise === 0)
    : []

  const showUpiNudge = !!(profile && !profile.upi_id && !isUpiNudgeDismissed)

  return (
    <PageWrapper title="Yaari Khaatha" showBackButton={false} showNav={true}>
      <div className="flex flex-col gap-5">
        
        {/* Total Summaries */}
        {isLoading ? (
          <div className="w-full h-[120px] bg-hero/10 animate-pulse rounded-hero" />
        ) : isError ? (
          <div className="w-full p-4 bg-error/10 border border-error/20 rounded-hero flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-xs font-semibold">
              Failed to load balances. {error?.message || 'Please try again.'}
            </div>
            <button onClick={() => refetch()} className="p-1 hover:bg-error/20 rounded-full cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <HeroCard
            peopleOweMeTotal={peopleOweMeTotalPaise}
            iOwePeopleTotal={iOwePeopleTotalPaise}
            showUpiNudge={showUpiNudge}
            onDismissUpiNudge={dismissUpiNudge}
          />
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
            className="py-2.5"
          />

          {/* Quick Filters */}
          <div className="flex bg-divider/40 p-0.5 rounded-chip border border-divider/60 font-sans">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${filter === 'all' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('owes_me')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${filter === 'owes_me' ? 'bg-card text-positive shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Owes You
            </button>
            <button
              onClick={() => setFilter('i_owe')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-[6px] transition-all select-none cursor-pointer ${filter === 'i_owe' ? 'bg-card text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              You Owe
            </button>
          </div>
        </div>

        {/* Ledger Contacts List */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-secondary">
            Friends Ledger
          </h3>

          {isLoading ? (
            // Skeleton loaders
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full h-20 bg-card border border-divider animate-pulse rounded-card flex items-center p-4 gap-3">
                <div className="w-11 h-11 bg-divider rounded-full" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="w-24 h-4 bg-divider rounded" />
                  <div className="w-16 h-3 bg-divider rounded" />
                </div>
                <div className="w-12 h-5 bg-divider rounded" />
              </div>
            ))
          ) : activeBalances.length > 0 || settledBalances.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {activeBalances.map((person) => (
                <PersonCard
                  key={person.personId}
                  personId={person.personId}
                  name={person.name}
                  label={person.label}
                  netBalancePaise={person.netBalancePaise}
                  direction={person.direction}
                />
              ))}

              {settledBalances.length > 0 && (
                <div className="flex flex-col gap-2.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSettled(!showSettled)}
                    className="w-full py-2.5 border border-border bg-card/45 text-text-secondary hover:text-text-primary rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
                  >
                    <span>{showSettled ? 'Hide settled friends' : `Show settled friends (${settledBalances.length})`}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSettled ? 'rotate-180' : ''}`} />
                  </button>

                  {showSettled && (
                    <div className="flex flex-col gap-2.5 mt-1">
                      {settledBalances.map((person) => (
                        <PersonCard
                          key={person.personId}
                          personId={person.personId}
                          name={person.name}
                          label={person.label}
                          netBalancePaise={person.netBalancePaise}
                          direction={person.direction}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isInitialEmpty ? (
            // Initial Empty State
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-divider rounded-card text-center gap-4 font-sans select-none shadow-card">
              <div className="w-24 h-24 flex items-center justify-center">
                <HomeEmptyIllustration />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-medium text-text-primary text-[16px] leading-tight">
                  Your khata is empty
                </h4>
                <p className="text-[13px] text-text-secondary max-w-[260px] leading-normal">
                  Log who paid for chai, auto, or that Dominos order — settle it later.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openSheet('add-transaction')}
                className="font-semibold px-5 py-2.5 text-xs shadow-cta cursor-pointer select-none active:scale-[0.98] transition-all"
              >
                Log your first transaction +
              </Button>
            </div>
          ) : (
            // Search / Filter Empty State
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-divider rounded-card text-center gap-2">
              <Users className="w-8 h-8 text-text-tertiary" />
              <h4 className="font-semibold text-text-primary text-sm mt-1">No friends found</h4>
              <p className="text-xs text-text-secondary max-w-[200px] leading-relaxed">
                Try clearing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
