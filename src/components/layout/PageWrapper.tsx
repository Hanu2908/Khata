import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  rightAction?: React.ReactNode
  showNav?: boolean
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  showBackButton = false,
  rightAction,
}) => {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6 pb-24 lg:pb-6 font-sans flex flex-col gap-5">
      {/* Page Header */}
      {(title || showBackButton || rightAction) && (
        <div className="flex items-center justify-between min-h-10 border-b border-divider pb-3.5 select-none">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-full hover:bg-divider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {title && (
              <h2 className="text-[20px] font-bold text-text-primary tracking-tight">
                {title}
              </h2>
            )}
          </div>
          {rightAction && (
            <div className="flex items-center">
              {rightAction}
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  )
}

