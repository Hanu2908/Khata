/**
 * UPI deep-link builder + platform detection.
 * No payment processing — deep-link + QR only.
 */

interface UPILinkParams {
  upiId: string
  name: string
  amountPaise: number
  note?: string
}

export function buildUPILink({ upiId, name, amountPaise, note }: UPILinkParams): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: (amountPaise / 100).toFixed(2),
    cu: 'INR',
    tn: note || 'Settlement via Yaari Khaatha',
  })
  return `upi://pay?${params.toString()}`
}

export type UPIDisplayMode = 'deeplink' | 'qr' | 'both'

/**
 * Determine how to show UPI payment option based on device.
 * Used ONLY on the public share page (/s/[token]).
 */
export function getUPIDisplayMode(): UPIDisplayMode {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'deeplink'   // Android: deep-link opens PhonePe/GPay/Paytm
  if (/iphone|ipad/i.test(ua)) return 'qr'     // iOS: QR code (primary) + deep-link attempt
  return 'both'                                  // Desktop: QR code + copy UPI ID button
}
