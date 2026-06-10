import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  prefixText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      prefixText,
      className = '',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {prefixIcon && (
            <div className="absolute left-3.5 text-text-tertiary flex items-center justify-center pointer-events-none">
              {prefixIcon}
            </div>
          )}
          {prefixText && (
            <div className="absolute left-3.5 text-text-secondary font-medium font-sans flex items-center justify-center pointer-events-none select-none">
              {prefixText}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full font-sans text-base md:text-sm font-medium bg-card border text-text-primary rounded-chip transition-all duration-200 outline-none
              ${prefixIcon || prefixText ? 'pl-10' : 'pl-4'}
              ${suffixIcon ? 'pr-10' : 'pr-4'}
              py-3
              ${error ? 'border-error focus:ring-1 focus:ring-error focus:border-error' : 'border-border focus:border-text-secondary focus:ring-1 focus:ring-text-secondary'}
              placeholder:text-text-tertiary placeholder:font-normal
              ${className}
            `}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3.5 text-text-tertiary flex items-center justify-center pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-[12px] text-error font-medium leading-none">{error}</span>
        ) : helperText ? (
          <span className="text-[12px] text-text-tertiary leading-none">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
