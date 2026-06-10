import React from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useActivity } from '@/hooks/useActivity'
import { ActivityItem } from '@/components/ledger/ActivityItem'
import { DateGroupHeader } from '@/components/ledger/DateGroupHeader'
import { ActivityEmptyIllustration } from '@/components/ui/illustrations/ActivityEmptyIllustration'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Activity() {
  const { data: timeline, isLoading, isError, error, refetch } = useActivity()

  return (
    <PageWrapper title="Activity Timeline" showBackButton={false} showNav={true}>
      <div className="flex flex-col gap-4">
        
        {/* Section Title */}
        <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-text-secondary">
          Recent Activity (Last 90 Days)
        </h3>

        {/* Timeline Content */}
        {isLoading ? (
          // Skeletons
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full h-20 bg-card border border-divider animate-pulse rounded-card" />
            ))}
          </div>
        ) : isError ? (
          <div className="w-full p-4 bg-error/10 border border-error/20 rounded-hero flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-xs font-semibold">
              Failed to load activity feed. {error?.message || 'Please try again.'}
            </div>
            <button onClick={() => refetch()} className="p-1 hover:bg-error/20 rounded-full cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : timeline && timeline.length > 0 ? (
          <div className="flex flex-col gap-3">
            {(() => {
              let lastDate = ''
              return timeline.map((item) => {
                const showHeader = item.date !== lastDate
                lastDate = item.date
                return (
                  <React.Fragment key={item.id}>
                    {showHeader && <DateGroupHeader dateString={item.date} />}
                    <ActivityItem item={item} />
                  </React.Fragment>
                )
              })
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-card border border-divider rounded-card text-center gap-4 font-sans select-none shadow-card">
            <div className="w-24 h-24 flex items-center justify-center">
              <ActivityEmptyIllustration />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-medium text-text-primary text-[16px] leading-tight">
                Nothing here yet
              </h4>
              <p className="text-[13px] text-text-secondary max-w-[260px] leading-normal">
                Your transactions and settlements will show up here.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
