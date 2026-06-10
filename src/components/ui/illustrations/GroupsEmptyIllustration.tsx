import React from 'react'

export const GroupsEmptyIllustration: React.FC = () => {
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

      {/* Avatar 1 (Left Back) */}
      <g opacity="0.75">
        <circle cx="44" cy="68" r="16" fill="var(--color-avatar-bg)" />
        <path
          d="M32 94C32 85.1634 37.3726 78 44 78C50.6274 78 56 85.1634 56 94"
          stroke="var(--color-bg)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Avatar 2 (Right Back) */}
      <g opacity="0.75">
        <circle cx="76" cy="68" r="16" fill="var(--color-avatar-bg)" />
        <path
          d="M64 94C64 85.1634 69.3726 78 76 78C82.6274 78 88 85.1634 88 94"
          stroke="var(--color-bg)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Avatar 3 (Center Front) */}
      <g>
        <circle
          cx="60"
          cy="56"
          r="18"
          fill="var(--color-avatar-bg)"
          stroke="var(--color-card)"
          strokeWidth="3"
        />
        <path
          d="M44 86C44 76.0589 51.1634 68 60 68C68.8366 68 76 76.0589 76 86"
          stroke="var(--color-card)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* Floating Plus Badge */}
      <circle
        cx="84"
        cy="40"
        r="12"
        fill="var(--color-accent)"
        stroke="var(--color-card)"
        strokeWidth="2.5"
      />
      <path
        d="M84 35V45M79 40H89"
        stroke="var(--color-text-on-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
