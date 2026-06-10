import { describe, it, expect } from 'vitest'
import { getNetBalance, getBalanceDirection, formatCurrency, equalSplit, isOverpayment } from '../balance'
import { buildUPILink } from '../upi'
import { getTokenExpiresAt } from '../share'

describe('balance.ts tests', () => {
  it('getNetBalance - zero, partial, full, overpayment', () => {
    // Zero balance
    expect(getNetBalance([], [])).toBe(0)

    // Partial settlement (they paid me back)
    expect(getNetBalance(
      [{ direction: 'owes_me', share_amount_paise: 10000 }],
      [{ amount_paise: 3000, direction: 'they_paid' }]
    )).toBe(7000)

    // Full settlement (they paid me back)
    expect(getNetBalance(
      [{ direction: 'owes_me', share_amount_paise: 10000 }],
      [{ amount_paise: 10000, direction: 'they_paid' }]
    )).toBe(0)

    // Overpayment by them (negative result)
    expect(getNetBalance(
      [{ direction: 'owes_me', share_amount_paise: 10000 }],
      [{ amount_paise: 12000, direction: 'they_paid' }]
    )).toBe(-2000)

    // Partial settlement (I paid them back)
    expect(getNetBalance(
      [{ direction: 'i_owe', share_amount_paise: 10000 }],
      [{ amount_paise: 3000, direction: 'i_paid' }]
    )).toBe(-7000)

    // Full settlement (I paid them back)
    expect(getNetBalance(
      [{ direction: 'i_owe', share_amount_paise: 10000 }],
      [{ amount_paise: 10000, direction: 'i_paid' }]
    )).toBe(0)

    // Overpayment by me (positive result)
    expect(getNetBalance(
      [{ direction: 'i_owe', share_amount_paise: 10000 }],
      [{ amount_paise: 12000, direction: 'i_paid' }]
    )).toBe(2000)

    // Mixed directions
    expect(getNetBalance(
      [
        { direction: 'owes_me', share_amount_paise: 15000 },
        { direction: 'i_owe', share_amount_paise: 5000 }
      ],
      [
        { amount_paise: 3000, direction: 'they_paid' },
        { amount_paise: 2000, direction: 'i_paid' }
      ]
    )).toBe(9000)
  })

  it('getBalanceDirection', () => {
    expect(getBalanceDirection(5000)).toBe('owes_me')
    expect(getBalanceDirection(-2000)).toBe('i_owe')
    expect(getBalanceDirection(0)).toBe('settled')
  })

  it('formatCurrency', () => {
    // Integer rupees
    expect(formatCurrency(48000)).toBe('₹480')
    // Decimal rupees
    expect(formatCurrency(34050)).toBe('₹340.50')
    // Negative paise (abs output, no negative sign)
    expect(formatCurrency(-30000)).toBe('₹300')
  })

  it('equalSplit', () => {
    // ₹100 split among 3 people
    const split1 = equalSplit(10000, 3)
    expect(split1).toEqual([3334, 3333, 3333])
    expect(split1.reduce((a, b) => a + b, 0)).toBe(10000)

    // ₹10 split among 2 people
    const split2 = equalSplit(1000, 2)
    expect(split2).toEqual([500, 500])
    expect(split2.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('isOverpayment', () => {
    expect(isOverpayment(15000, 10000)).toBe(true)
    expect(isOverpayment(10000, 10000)).toBe(false)
    expect(isOverpayment(5000, 10000)).toBe(false)
    // Works with negative balance values
    expect(isOverpayment(15000, -10000)).toBe(true)
  })
})

describe('upi.ts tests', () => {
  it('buildUPILink', () => {
    const link = buildUPILink({
      upiId: 'rahul@oksbi',
      name: 'Rahul Sharma',
      amountPaise: 15050,
      note: 'Lunch Split'
    })
    expect(link).toContain('pa=rahul%40oksbi')
    expect(link).toContain('pn=Rahul+Sharma')
    expect(link).toContain('am=150.50')
    expect(link).toContain('tn=Lunch+Split')
  })
})

describe('share.ts tests', () => {
  it('getTokenExpiresAt', () => {
    const expiresAt = new Date(getTokenExpiresAt())
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })
})
