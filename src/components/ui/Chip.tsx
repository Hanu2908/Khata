import React from 'react'

interface ChipProps {
  label: string
  isActive?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  className?: string
}

export const Chip: React.FC<ChipProps> = ({
  label,
  isActive = false,
  onClick,
  icon,
  className = '',
}) => {
  const isClickable = !!onClick

  const activeStyles = 'bg-accent text-white border-transparent'
  const inactiveStyles = 'bg-card text-text-secondary border-border hover:text-text-primary hover:border-text-tertiary'

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-chip border text-xs font-semibold font-sans tracking-wide transition-all duration-200 select-none
        ${isActive ? activeStyles : inactiveStyles}
        ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${className}
      `}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      {label}
    </button>
  )
}
