import React from 'react'
import { isToday, parseISO, format } from 'date-fns'

interface DateGroupHeaderProps {
  dateString: string
}

export const DateGroupHeader: React.FC<DateGroupHeaderProps> = ({ dateString }) => {
  const date = parseISO(dateString)
  const formattedDate = format(date, 'd MMM yyyy')
  const suffix = isToday(date) ? ' · Today' : ''

  return (
    <div className="flex items-center justify-center my-4 select-none font-sans">
      <div className="flex-1 h-[1px] bg-divider" />
      <span className="px-3 text-[11px] font-medium tracking-[0.08em] uppercase text-text-tertiary">
        {formattedDate}{suffix}
      </span>
      <div className="flex-1 h-[1px] bg-divider" />
    </div>
  )
}
