import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'positive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium font-sans select-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  
  const variantStyles = {
    primary: 'bg-accent text-white shadow-cta hover:bg-opacity-95',
    secondary: 'bg-hero text-text-on-hero hover:bg-opacity-90',
    outline: 'border border-border text-text-primary hover:bg-card',
    danger: 'bg-error text-white hover:bg-opacity-95',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-divider',
    positive: 'bg-positive text-white hover:bg-opacity-95',
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-chip font-medium',
    md: 'text-[15px] px-5 py-2.5 rounded-cta font-semibold tracking-[0.01em]',
    lg: 'text-base px-6 py-3.5 rounded-hero font-semibold tracking-[0.01em]',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      )}
      {children}
    </button>
  )
}
