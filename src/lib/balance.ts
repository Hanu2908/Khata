/**
 * Balance calculation — single source of truth.
 * All amounts in paise (integer). No floats.
 * Positive = they owe me. Negative = I owe them.
 */

export interface TransactionPerson {
  direction: 'owes_me' | 'i_owe'
  share_amount_paise: number
}

export interface Settlement {
  amount_paise: number
  direction: 'i_paid' | 'they_paid'
}

export type BalanceDirection = 'owes_me' | 'i_owe' | 'settled'

/**
 * Get net balance with a person.
 * Positive = they owe me. Negative = I owe them.
 * Always integer paise. No floats.
 */
export function getNetBalance(
  transactionPersons: TransactionPerson[],
  settlements: Settlement[]
): number {
  const txBalance = transactionPersons.reduce((acc, tp) => {
    return tp.direction === 'owes_me'
      ? acc + tp.share_amount_paise
      : acc - tp.share_amount_paise
  }, 0)

  const settlementSum = settlements.reduce((acc, s) => {
    return s.direction === 'they_paid'
      ? acc - s.amount_paise // they paid me back reduces what they owe me (goes towards 0)
      : acc + s.amount_paise // I paid them back reduces what I owe them (goes towards 0)
  }, 0)

  return txBalance + settlementSum
  // Note: result can be negative (overpayment case — balance flips direction)
}

/**
 * Get the direction of a balance.
 * Use this to determine UI color and label — never use raw negative sign.
 */
export function getBalanceDirection(paise: number): BalanceDirection {
  if (paise > 0) return 'owes_me'
  if (paise < 0) return 'i_owe'
  return 'settled'
}

/**
 * Format paise as Indian rupee string.
 * ALWAYS returns absolute value — no minus sign.
 * Use getBalanceDirection() to determine color/label in UI.
 *
 * 34050  → "₹340.50"
 * 48000  → "₹480"
 * -30000 → "₹300"  ← absolute, no minus
 */
export function formatCurrency(paise: number): string {
  const rupees = Math.abs(paise) / 100
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Equal split — integer arithmetic, handles rounding correctly.
 * ₹100 among 3 people = [3334, 3333, 3333] paise.
 * Remainder (+1 paise each) distributed to first N people.
 * Total of returned array always equals totalPaise exactly.
 */
export function equalSplit(totalPaise: number, numPeople: number): number[] {
  const base = Math.floor(totalPaise / numPeople)
  const remainder = totalPaise % numPeople
  return Array.from({ length: numPeople }, (_, i) =>
    i < remainder ? base + 1 : base
  )
}

/**
 * Check if a settlement amount would be an overpayment.
 * Warn user if true — but still allow after confirmation.
 */
export function isOverpayment(
  settlementAmountPaise: number,
  currentNetBalancePaise: number
): boolean {
  return settlementAmountPaise > Math.abs(currentNetBalancePaise)
}
