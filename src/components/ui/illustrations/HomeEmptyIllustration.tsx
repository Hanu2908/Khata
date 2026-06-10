import React from 'react'

export const HomeEmptyIllustration: React.FC = () => {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none"
    >
      {/* Background soft circle */}
      <circle cx="60" cy="60" r="50" fill="var(--color-divider)" opacity="0.3" />
      
      {/* Exchanging coin path/shapes */}
      {/* Hand 1 (Left to Right) */}
      <path
        d="M20 70H40C44 70 48 73 48 77V77C48 81 44 84 40 84H25"
        stroke="var(--color-avatar-bg)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 70C25 65 32 63 38 65L46 68C49 69 52 68 54 65V65"
        stroke="var(--color-avatar-bg)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      {/* Hand 2 (Right to Left) */}
      <path
        d="M100 50H80C76 50 72 47 72 43V43C72 39 76 36 80 36H95"
        stroke="var(--color-avatar-bg)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100 50C95 55 88 57 82 55L74 52C71 51 68 52 66 55V55"
        stroke="var(--color-avatar-bg)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Coin being passed in center */}
      <circle
        cx="60"
        cy="60"
        r="14"
        fill="var(--color-accent)"
        stroke="var(--color-card)"
        strokeWidth="2.5"
      />
      
      {/* Coin inner symbol (Indian Rupee symbol style outline) */}
      <path
        d="M57 56H63.5M57 60H63.5M60 56C62 56 63 57 63 58.5C63 60 62 61 60 61H57.5L62.5 66"
        stroke="var(--color-text-on-accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Dynamic movement dash lines */}
      <path
        d="M48 48L44 44"
        stroke="var(--color-text-tertiary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M72 72L76 76"
        stroke="var(--color-text-tertiary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
