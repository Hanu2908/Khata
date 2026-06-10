import React from 'react'
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'

export const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="bottom-center"
      expand={false}
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'w-full max-w-[350px] bg-card border border-border rounded-card shadow-card p-4 flex items-start gap-3 text-text-primary font-sans leading-tight transition-all duration-300 animate-scale-in',
          title: 'text-[14px] font-semibold text-text-primary tracking-[-0.1px]',
          description: 'text-[12px] text-text-secondary mt-0.5',
          content: 'flex flex-col flex-1',
        },
      }}
    />
  )
}

export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast(message, {
      description,
      icon: <CheckCircle2 className="w-4.5 h-4.5 text-positive shrink-0 mt-0.5" />,
    })
  },
  error: (message: string, description?: string) => {
    return sonnerToast(message, {
      description,
      icon: <AlertTriangle className="w-4.5 h-4.5 text-negative shrink-0 mt-0.5" />,
    })
  },
  info: (message: string, description?: string) => {
    return sonnerToast(message, {
      description,
      icon: <Info className="w-4.5 h-4.5 text-text-secondary shrink-0 mt-0.5" />,
    })
  },
}
