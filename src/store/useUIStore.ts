/**
 * Zustand store — UI-only state.
 * Server state lives in TanStack Query, not here.
 */

import { create } from 'zustand'

interface UIState {
  // Dark mode
  isDark: boolean
  toggleDark: () => void
  setDark: (dark: boolean) => void

  // Bottom sheet / modal
  activeSheet: string | null
  openSheet: (id: string) => void
  closeSheet: () => void

  // UPI nudge
  isUpiNudgeDismissed: boolean
  dismissUpiNudge: () => void

  // FAB pulse
  fabPulsed: boolean
  setFabPulsed: (pulsed: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Dark mode — init from localStorage or system preference
  isDark: (() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('yk-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })(),

  toggleDark: () =>
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('yk-theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    }),

  setDark: (dark) => {
    localStorage.setItem('yk-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
    set({ isDark: dark })
  },

  // Sheets
  activeSheet: null,
  openSheet: (id) => set({ activeSheet: id }),
  closeSheet: () => set({ activeSheet: null }),

  // UPI nudge - session-scoped so it resets on new session
  isUpiNudgeDismissed: (() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('yk-upi-nudge-dismissed') === 'true'
  })(),

  dismissUpiNudge: () => {
    sessionStorage.setItem('yk-upi-nudge-dismissed', 'true')
    set({ isUpiNudgeDismissed: true })
  },

  // FAB pulse - session-scoped so it resets on new session
  fabPulsed: (() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('yk-fab-pulsed') === 'true'
  })(),

  setFabPulsed: (pulsed) => {
    sessionStorage.setItem('yk-fab-pulsed', pulsed ? 'true' : 'false')
    set({ fabPulsed: pulsed })
  },
}))
