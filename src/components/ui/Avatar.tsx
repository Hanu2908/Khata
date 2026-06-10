import React from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const getInitials = (str: string) => {
    if (!str) return '?'
    const parts = str.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-[12px] font-semibold',
    md: 'w-11 h-11 text-sm font-semibold',
    lg: 'w-16 h-16 text-xl font-bold',
  }

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-avatar bg-avatar-bg text-avatar-text select-none font-sans shrink-0
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  )
}
