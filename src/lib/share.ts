import { nanoid } from 'nanoid'
import { formatCurrency } from '@/lib/balance'

export function generateToken(): string {
  return nanoid(8) // URL-safe, 8 chars, ~40 bits entropy
}

export function buildShareURL(token: string): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseUrl}/s/${token}`
}

export function buildShareMessage(balancePaise: number, shareUrl: string): string {
  const amount = formatCurrency(Math.abs(balancePaise))
  if (balancePaise > 0) {
    return `Hey! According to my Yaari Khaatha records, you owe me ${amount}. Here's the full breakdown: ${shareUrl}`
  }
  return `Hey! Sharing my Yaari Khaatha record of what I owe you — ${amount}. Check it here: ${shareUrl}`
}

export function buildWhatsAppURL(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function getTokenExpiresAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString()
  // Always set expires_at = now + 30 days on token insert. Never null.
}
