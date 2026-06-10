import React from 'react'

export const ActivityEmptyIllustration: React.FC = () => {
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

      {/* Notebook Base / Cover */}
      <rect
        x="36"
        y="30"
        width="48"
        height="60"
        rx="4"
        fill="var(--color-avatar-bg)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />

      {/* Notebook Pages (Inside) */}
      <rect
        x="42"
        y="34"
        width="38"
        height="52"
        rx="2"
        fill="var(--color-card)"
      />

      {/* Page Lines (Minimalist placeholder lines) */}
      <line x1="48" y1="44" x2="74" y2="44" stroke="var(--color-divider)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="52" x2="74" y2="52" stroke="var(--color-divider)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="60" x2="70" y2="60" stroke="var(--color-divider)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="68" x2="64" y2="68" stroke="var(--color-divider)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Notebook Binder Rings */}
      <path d="M32 40H38" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 50H38" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 60H38" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 70H38" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 80H38" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" />

      {/* Diagonal Pencil */}
      <g transform="translate(68, 54) rotate(-35)">
        {/* Pencil Body */}
        <rect
          x="-5"
          y="-25"
          width="10"
          height="40"
          rx="1"
          fill="var(--color-accent)"
          stroke="var(--color-card)"
          strokeWidth="1.5"
        />
        {/* Pencil Tip (Wood) */}
        <path
          d="M-5 15L0 23L5 15H-5Z"
          fill="var(--color-bg)"
          stroke="var(--color-card)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Lead point */}
        <path
          d="M-2 19.5L0 23L2 19.5H-2Z"
          fill="var(--color-avatar-bg)"
        />
        {/* Eraser cap */}
        <rect
          x="-5"
          y="-30"
          width="10"
          height="5"
          rx="1"
          fill="var(--color-text-tertiary)"
        />
      </g>
    </svg>
  )
}
