# Yaari Khaatha — Master Build Spec
**Version:** 1.1 — Transaction management + person detail page locked
**Author:** Himanshu Saini
**Status:** Ready to build
**Last updated:** June 2026

> This document is the single source of truth for any coding agent building Yaari Khaatha V1.
> Every decision is locked. Do not infer. Do not improvise. Follow exactly.

## Changelog
| Version | Change |
|---------|--------|
| 1.0 | Initial grill-locked spec |
| 1.1 | Added Section 24: Person detail page layout, pinned action buttons, ledger row anatomy, transaction details bottom sheet, edit flow, delete flow. Decisions #29–40 logged. |

---

## 0. Agent Instructions

- Developer is a first-year CSE student. **Readable code over clever code.**
- All files `.ts` / `.tsx`. No `.js` / `.jsx`.
- Ask before adding any dependency not listed in this spec.
- Money is **always paise integers**. No floats. No exceptions.
- All Supabase calls in `try/catch`. Always show skeleton loaders.
- Flag any out-of-scope feature request. Refuse politely.
- Use `@/` path alias throughout (`@/lib/balance`, `@/components/ui/Button`, etc.)

---

## 1. Stack (Locked)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18 + Vite | Fast HMR |
| Language | TypeScript (relaxed) | `strict: false`, `noImplicitAny: false` |
| Styling | Tailwind CSS v4 | `@theme` tokens, CSS-native |
| State (server) | TanStack Query v5 | Caching, refetching, optimistic updates |
| State (UI) | Zustand | UI-only state |
| Routing | React Router v6 | Standard |
| Icons | Lucide React | Only icon library |
| Font | DM Sans | Google Fonts |
| QR Code | qrcode.react | Client-side UPI QR |
| PWA | vite-plugin-pwa | Service worker + manifest |
| Backend | Supabase | PostgreSQL + RLS + Auth |
| Auth | Email/pass + Google OAuth + email OTP | No SMS |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) | |
| Token gen | nanoid | For share tokens |
| Testing | Vitest | Unit tests on lib files |

**Do NOT use:** Firebase, PocketBase, MongoDB, React Native, Expo.

---

## 2. TypeScript Config

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "ignoreDeprecations": "6.0"
  }
}
```

---

## 3. Database Schema

Run this entire file in Supabase SQL editor: `supabase/schema.sql`

### 3.1 profiles

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  upi_id text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
```

### 3.2 persons

```sql
create table persons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  label text,           -- disambiguation display name (e.g. "Rahul Hostel")
  phone text,
  upi_id text,
  linked_user_id uuid references auth.users on delete set null,  -- V3 only, not used in V1 UI
  created_at timestamptz default now()
);

alter table persons enable row level security;
create policy "Users can CRUD own persons"
  on persons for all using (auth.uid() = user_id);
```

**Person display rule:** Show `label` if set, else `name`. `name` is always the real name.
**Duplicate detection:** On create, if another person with same `name` exists in user's ledger → warn + force `label` entry before saving.
**Share page:** Always use `name` (real name), never `label`.
**V3 matching rule:** Never auto-match by name. Match by phone or email only. Always show confirmation UI.

### 3.3 groups + group_persons

```sql
create table groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table group_persons (
  group_id uuid references groups on delete cascade,
  person_id uuid references persons on delete cascade,
  primary key (group_id, person_id)
);

alter table groups enable row level security;
create policy "Users can CRUD own groups"
  on groups for all using (auth.uid() = user_id);
```

### 3.4 transactions

```sql
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  paid_by text check (paid_by in ('me', 'them', 'third_party')) not null,
  -- 'third_party' is in schema for V1.1 but NEVER exposed in V1 UI
  amount_paise integer not null check (amount_paise > 0),
  currency text default 'INR',
  note text,
  date date not null default current_date,
  type text check (type in ('direct', 'group_split', 'settlement')) not null,
  group_id uuid references groups(id) on delete set null,
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Users can CRUD own transactions"
  on transactions for all using (auth.uid() = user_id);
```

### 3.5 transaction_persons

```sql
create table transaction_persons (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references transactions on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  share_amount_paise integer not null check (share_amount_paise > 0),
  direction text check (direction in ('owes_me', 'i_owe')) not null,
  is_settled boolean default false,
  -- is_settled is AUTO-COMPUTED UI hint only. Set to true when getNetBalance() === 0.
  -- NEVER used in balance calculation. settlements table is the source of truth.
  created_at timestamptz default now()
);

alter table transaction_persons enable row level security;
create policy "Users can CRUD own transaction_persons"
  on transaction_persons for all
  using (
    exists (
      select 1 from transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  );
```

**Group split row rule:**
- Payer gets **no** `transaction_persons` row.
- Each non-payer gets one row with `direction = 'owes_me'` (if I paid) or `direction = 'i_owe'` (if they paid).
- V3 migration note: Migrate to Splitwise-style model where everyone including payer gets a row.

### 3.6 settlements

```sql
create table settlements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  amount_paise integer not null check (amount_paise > 0),
  direction text check (direction in ('they_paid', 'i_paid')) not null,
  -- 'they_paid' = they settled what they owed me (reduces positive balance)
  -- 'i_paid'    = I settled what I owed them (reduces negative balance)
  method text check (method in ('cash', 'upi', 'other')) default 'cash',
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table settlements enable row level security;
create policy "Users can CRUD own settlements"
  on settlements for all using (auth.uid() = user_id);
```

### 3.7 share_tokens

```sql
create table share_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  token text unique not null,
  expires_at timestamptz not null,
  -- ALWAYS set to created_at + 30 days. Never null. Never skip.
  created_at timestamptz default now()
);

alter table share_tokens enable row level security;
create policy "Anyone can read share tokens"
  on share_tokens for select using (true);
create policy "Users can manage own tokens"
  on share_tokens for all using (auth.uid() = user_id);
```

---

## 4. Core Logic — `src/lib/balance.ts`

This is the **single source of truth** for all money calculations. Never duplicate this logic elsewhere.

```typescript
// src/lib/balance.ts

export interface TransactionPerson {
  direction: 'owes_me' | 'i_owe'
  share_amount_paise: number
}

export interface Settlement {
  amount_paise: number
  direction: 'they_paid' | 'i_paid'
  // 'they_paid' = they settled what they owed me (reduces positive balance)
  // 'i_paid'    = I settled what I owed them (reduces negative balance)
}

export type BalanceDirection = 'owes_me' | 'i_owe' | 'settled'

/**
 * Get net balance with a person.
 * Positive = they owe me. Negative = I owe them.
 * Always integer paise. No floats.
 *
 * Settlement logic:
 *   'they_paid' subtracts from balance (they paid off what they owed me)
 *   'i_paid'    adds back to balance   (I paid off what I owed them)
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

  const settledBalance = settlements.reduce((acc, s) => {
    return s.direction === 'they_paid'
      ? acc - s.amount_paise   // reduces positive balance (they owed me, now paid)
      : acc + s.amount_paise   // reduces negative balance (I owed them, now paid)
  }, 0)

  return txBalance + settledBalance
  // Note: result can be negative (overpayment — balance flips direction)
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
```

**UI rules for balance display:**

| `getBalanceDirection()` | Color token | Label |
|-------------------------|-------------|-------|
| `owes_me` | `--color-positive` (green) | "owes you" |
| `i_owe` | `--color-accent` (orange) | "you owe" |
| `settled` | `--color-text-tertiary` (grey) | "settled up" |

**Overpayment flow:**
1. User enters settlement amount.
2. Call `isOverpayment(amount, getNetBalance(...))`.
3. If `true` → show direction-aware warning:
   - `owes_me` direction: *"This is more than [Name] owes you. Balance will flip to you owing them ₹X. Continue anyway?"*
   - `i_owe` direction:   *"This is more than you owe [Name]. Balance will flip to them owing you ₹X. Continue anyway?"*
4. User confirms → save settlement normally. Balance flips direction. UI re-renders automatically.
5. No hard block. Always allow after confirmation.

`LogSettlement` component receives `currentDirection: BalanceDirection` as a prop to pick the correct warning string.

**`is_settled` auto-update rule:**
After any settlement is saved, recompute `getNetBalance()` for that person. If result `=== 0`, set `is_settled = true` on all `transaction_persons` rows for that person. If result `!== 0`, set all to `false`. This is a UI-only flag — never used in balance calculation.

---

## 5. UPI Logic — `src/lib/upi.ts`

```typescript
// src/lib/upi.ts

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
```

**Share page UPI rendering rules:**

**Step 1 — Guard: check if owner has a UPI ID**
- If `profiles.upi_id` is null or empty → hide ALL UPI payment UI entirely.
- Show plain text instead: *"Payment via UPI not available for this ledger."*
- No broken deep-links. No empty QR codes.

**Step 2 — If UPI ID exists, render by device:**

| Device | Show |
|--------|------|
| Android | "Pay ₹X via UPI" deep-link button only |
| iOS | QR code (primary) + "Open in UPI app" deep-link attempt |
| Desktop | QR code + "Copy UPI ID" button |

QR code rendered client-side:
```tsx
import { QRCodeSVG } from 'qrcode.react'
<QRCodeSVG value={upiDeepLink} size={200} />
```

---

## 6. Share Token Logic — `src/lib/share.ts`

```typescript
// src/lib/share.ts

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
```

**Share token flow:**

```
User taps "Share with [Name]"
  → generateToken() → nanoid(8)
  → Insert share_tokens: { token, user_id, person_id, expires_at: now+30days }
  → Return URL: buildShareURL(token)
  → Open WhatsApp: buildWhatsAppURL(buildShareMessage(balance, url))

Recipient opens /s/[token] (no login required)
  → Query share_tokens where token = [token]
  → If not found → show "Link not found" screen
  → If expires_at < now → show "This link has expired" screen
  → If valid → fetch live ledger data:
      - profiles.name (owner name)
      - persons.name (always real name, NEVER label)
      - transaction_persons for this person
      - settlements for this person
  → Render read-only ShareableSummary component
  → Show UPI payment based on getUPIDisplayMode()
  → Show "Something looks wrong?" button
```

**"Something looks wrong?" button:**
- Triggers a Supabase Edge Function: `notify-owner`
- Edge function sends email to ledger owner: *"[Person name] flagged an issue with your shared Yaari Khaatha ledger."*
- No reply thread. One-way notification only.
- Show success toast: "We've notified [Owner name]."

**Manual revocation:**
- On person detail page: "Delete share link" button
- Deletes the `share_tokens` row for that person
- Old link immediately returns "Link not found"
- User can generate a new link anytime (new token, new 30-day window)

---

## 7. Home Screen Balance Aggregation

**Method:** Client-side. Two TanStack Query fetches. Merge in browser.

```typescript
// Fetch 1: all transaction_persons for the logged-in user
// JOIN persons to get person names
// Query: transaction_persons → transactions (filter user_id = me) → persons

// Fetch 2: all settlements for the logged-in user

// Client-side compute:
// For each person → getNetBalance(theirTxPersons, theirSettlements)
// Home totals:
//   peopleOweMe = sum of all positive net balances
//   iOwePeople  = sum of Math.abs() of all negative net balances
```

**Home screen display:**
```
┌─────────────────────────────────┐
│  People owe you      ₹1,240     │  ← positive sum, --color-positive
│  You owe             ₹480       │  ← negative sum abs, --color-accent
└─────────────────────────────────┘
[Active person cards — balance !== 0 — sorted by abs(balance) desc]

  ── settled friends (3) ▾  ← collapsible, tap to expand
  [Settled person cards — balance === 0 — grey, sorted alphabetically]
```

**Person list rendering rules:**
- **Active list** (default visible): persons where `getNetBalance() !== 0`, sorted by `Math.abs(balance)` descending.
- **Settled section** (collapsed by default): persons where `getNetBalance() === 0`. Hidden until tapped.
  - Label: *"Settled friends (N) ▾"* — N = count of settled persons.
  - If N === 0, render nothing (no empty section).
  - Expanding is UI-only state: `showSettled: boolean` in Zustand `useUIStore`.
  - Settled cards use `--color-text-tertiary` for name + "settled up" label. No balance amount shown.
- Hero card totals (`peopleOweMe`, `iOwePeople`) only count active balances — settled persons never contribute to totals.
- **UPI ID nudge**: If `profiles.upi_id` is null/empty, show a one-line dismissable prompt below the hero card:
  *"Add your UPI ID to let friends pay you directly →"* (taps to Settings)
  - Dismissed state stored as `upiNudgeDismissed: boolean` in Zustand `useUIStore`.
  - Once dismissed, never shown again for that session. Reappears next session until UPI ID is set.
  - Hide nudge entirely once UPI ID is saved.

**V1.1 migration note:** Replace client-side with a Supabase RPC `get_all_balances(user_id)` that does the GROUP BY in Postgres.

---

## 8. Activity Feed

**Method:** Two TanStack Query fetches. Merge + sort client-side.

```typescript
// Fetch 1: recent transactions (last 90 days), with person names via JOIN
// Fetch 2: recent settlements (last 90 days), with person names via JOIN

// Merge into ActivityItem[]:
type ActivityItem = {
  id: string
  type: 'transaction' | 'settlement'
  date: string           // ISO date string
  personName: string     // display name (label ?? name)
  amountPaise: number
  note?: string
  direction?: 'owes_me' | 'i_owe'  // transactions only
  method?: string                    // settlements only
}

// Sort by date descending (most recent first)
// Render unified timeline
```

---

## 9. Empty States

All empty states use inline SVG illustrations — warm mocha tones, consistent with Mocha Premium palette. One CTA maximum. Friendly, never formal tone.

### Home (no persons yet)
- **Illustration:** Two hands exchanging a coin — `--color-accent` coin, `--color-avatar-bg` hands, warm background
- **Heading:** *"Your khata is empty"* — `--color-text-primary`, 16px, 500
- **Body:** *"Log who paid for chai, auto, or that Dominos order — settle it later."* — `--color-text-secondary`, 13px, 400
- **CTA:** *"Log your first transaction +"* — accent button, triggers FAB flow
- **FAB pulse:** Single CSS pulse animation on first visit only. Controlled by `fabPulsed: boolean` in Zustand `useUIStore`. Set to `true` after first pulse — never fires again.

### Groups (no groups yet)
- **Illustration:** Three overlapping circles/avatars with a small `+` badge — representing a group forming
- **Heading:** *"No groups yet"* — `--color-text-primary`, 16px, 500
- **Body:** *"Create a group for your hostel wing, trip, or friend circle."* — `--color-text-secondary`, 13px, 400
- **CTA:** *"Create a group"* — accent button, opens create group flow

### Activity (no transactions yet)
- **Illustration:** A small open notebook with a pencil — empty pages, warm tones
- **Heading:** *"Nothing here yet"* — `--color-text-primary`, 16px, 500
- **Body:** *"Your transactions and settlements will show up here."* — `--color-text-secondary`, 13px, 400
- **No CTA** — Activity is read-only. Primary action lives on FAB.

### Illustration spec (all three)
- Rendered as inline SVG components: `<HomeEmptyIllustration />`, `<GroupsEmptyIllustration />`, `<ActivityEmptyIllustration />`
- Located in `src/components/ui/illustrations/`
- Size: 120×120px viewBox, scales with container
- Colors: use only `--color-accent`, `--color-avatar-bg`, `--color-border`, `--color-bg` — no hardcoded hex in SVG
- No external image files. No Lottie. No GIFs. Pure SVG only.

---

## 10. Transaction Logging Logic

### Flow: Direct IOU

```
User taps FAB
  → Select "Direct IOU"
  → Select or add person
  → Enter amount (paise, converted from rupees input)
  → Optional note
  → Select direction: "I paid" or "They paid"
  → Confirm

On confirm:
  INSERT transactions: { paid_by: 'me'|'them', type: 'direct', amount_paise, note, date }
  INSERT transaction_persons: {
    transaction_id,
    person_id,
    share_amount_paise: amount_paise,  // full amount for direct IOU
    direction: paid_by === 'me' ? 'owes_me' : 'i_owe'
  }
```

### Flow: Group Split (Equal Only, V1)

```
User taps FAB
  → Select "Group Split"
  → Select or create group (or select persons ad-hoc)
  → Enter total amount
  → Select who paid: "I paid" or "[Person] paid"
  → Auto-calculate equal split via equalSplit(totalPaise, numPeople)
  → Show split preview (each person's share)
  → Confirm

On confirm:
  INSERT transactions: { paid_by: 'me'|'them', type: 'group_split', amount_paise, group_id, note, date }

  // numPeople = total headcount INCLUDING the payer
  // e.g. ₹480 among 4 people → each share = ₹120 (not ₹160)
  const shares = equalSplit(amount_paise, numPeople)  // length = numPeople

  // TWO CASES — one-sided ledger rules:

  // CASE A: I paid
  // Insert one row per NON-PAYER friend — they each owe me their share
  if (payer === 'me') {
    For each non-payer person (all selected participants except me):
      INSERT transaction_persons: {
        transaction_id,
        person_id,          // each friend
        share_amount_paise: shares[i],
        direction: 'owes_me'
      }
    // My own share is implicit — I already paid it. No row for me.
  }

  // CASE B: A friend paid
  // Only insert 1 row — my own share, I owe the payer
  // Rahul/Ankit's debts to Priya are NOT my ledger's concern
  if (payer === 'them') {
    INSERT transaction_persons: {
      transaction_id,
      person_id: payerPersonId,   // the friend who paid
      share_amount_paise: myShare, // equalSplit(total, numPeople)[myIndex]
      direction: 'i_owe'
    }
    // No rows for other participants — one-sided ledger.
  }
```

### Flow: Log Settlement

```
User opens person's ledger
  → Taps "Settle up"
  → Direction is AUTO-DERIVED from current balance (never ask the user):
      getBalanceDirection() === 'owes_me' → direction = 'they_paid'
      getBalanceDirection() === 'i_owe'   → direction = 'i_paid'
      getBalanceDirection() === 'settled' → show toast "Already settled up!" and exit
  → Enter amount (default = Math.abs(getNetBalance()))
  → Select method: cash | UPI | other
  → Optional note

Before confirm:
  if isOverpayment(amount, currentBalance):
    Show direction-aware warning modal:
    - owes_me: "This is more than [Name] owes you. Balance will flip to you owing them ₹X. Continue anyway?"
    - i_owe:   "This is more than you owe [Name]. Balance will flip to them owing you ₹X. Continue anyway?"
    → Cancel (stay on form) | Confirm (proceed)

On confirm:
  INSERT settlements: { person_id, amount_paise, direction, method, note, date }
  // direction auto-derived above — never user-entered

  // Auto-update is_settled:
  newBalance = getNetBalance(updatedTxPersons, updatedSettlements)
  if newBalance === 0:
    UPDATE transaction_persons SET is_settled = true WHERE person_id = [person_id]
  else:
    UPDATE transaction_persons SET is_settled = false WHERE person_id = [person_id]
```

---

## 11. Person Duplicate Detection

```typescript
// On AddPerson form submit:

const existingPersons = await fetchPersonsForUser(userId)
const duplicate = existingPersons.find(
  p => p.name.toLowerCase() === newName.toLowerCase()
)

if (duplicate) {
  // Show warning UI (not a blocking error — a guided step)
  // "You already have someone named [Name] in your khata.
  //  Add a label to tell them apart (e.g. 'Rahul Hostel', 'Rahul CS')"
  // Force label input before allowing save
  // DO NOT save without label if duplicate detected
}

// If no duplicate → save directly, no label prompt
```

---

## 12. Visual Design Tokens

```css
/* src/styles/tokens.css */
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-bg:             #F3EDE6;
  --color-card:           #FEFCF9;
  --color-hero:           #1A1613;

  /* Brand */
  --color-accent:         #C4470A;
  --color-positive:       #167A33;

  /* Text */
  --color-text-primary:   #1A1613;
  --color-text-secondary: #6D5F51;
  --color-text-tertiary:  #A49484;
  --color-text-on-hero:   #FEFCF9;
  --color-text-on-accent: #FFFFFF;

  /* Borders */
  --color-border:         #DDD5CA;
  --color-divider:        #EBE4DB;

  /* Feedback */
  --color-error:          #B91C1C;
  --color-success:        #167A33;

  /* Avatar */
  --color-avatar-bg:      #2C241C;
  --color-avatar-text:    #FEFCF9;

  /* Shadows */
  --shadow-card: 0 2px 8px rgba(26, 22, 19, 0.07), 0 1px 2px rgba(26, 22, 19, 0.04);
  --shadow-cta:  0 4px 14px rgba(196, 71, 10, 0.35);

  /* Typography */
  --font-sans: 'DM Sans', sans-serif;

  /* Radius */
  --radius-card:   14px;
  --radius-hero:   16px;
  --radius-cta:    13px;
  --radius-avatar: 50%;
  --radius-chip:   8px;
}

/* Dark mode — .dark class on <html> */
.dark {
  --color-bg:             #12100D;
  --color-card:           #1D1915;
  --color-hero:           #FEFCF9;
  --color-accent:         #E05A1A;
  --color-positive:       #3BD870;
  --color-text-primary:   #EDE8E0;
  --color-text-secondary: #968778;
  --color-text-tertiary:  #584E44;
  --color-text-on-hero:   #1A1613;
  --color-border:         #2A241E;
  --color-divider:        #201C18;
  --color-error:          #EF4444;
  --color-success:        #3BD870;
}
```

### Typography Scale — DM Sans

| Element | Size | Weight | Letter Spacing |
|---------|------|--------|----------------|
| Hero balance amount | 32px | 600 | -1px |
| Section heading | 12px | 500 | +0.08em, uppercase |
| Person name | 16px | 500 | -0.1px |
| Balance amount (list) | 15px | 600 | -0.3px |
| Note / subtitle | 13px | 400 | 0 |
| Timestamp / hint | 12px | 400 | 0 |
| CTA button | 15px | 600 | +0.01em |

**Minimum text size: 12px. Primary interactive text: 16px. Min touch target: 64px.**

### Accent Color Usage Rules
- `--color-accent` (orange) = CTA buttons + "you owe" amounts ONLY
- `--color-positive` (green) = "owes you" amounts ONLY
- Never use accent decoratively

---

## 13. Navigation

```
[ 🏠 Home ] [ 👥 Groups ] [ ➕ FAB ] [ 📋 Activity ] [ ⚙️ Settings ]
```

- **Home** — Hero card (total owed to me + I owe) + active person list sorted by abs(balance) desc + collapsed settled section
- **Groups** — Create/manage groups, view group splits
- **FAB (center, raised)** — Log transaction (primary action). Opens bottom sheet: Direct IOU | Group Split
- **Activity** — Unified timeline of transactions + settlements across all persons
- **Settings** — Profile (name, UPI ID), dark mode toggle, "Buy me a chai ☕"

Person detail = drill-down from Home (tap person card). NOT a nav tab.

---

## 14. PWA Configuration

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Yaari Khaatha',
    short_name: 'Yaari Khaatha',
    description: 'Your personal khata for friend transactions',
    theme_color: '#C4470A',
    background_color: '#F3EDE6',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/.*\.supabase\.co/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    }],
  },
})
```

---

## 15. Offline Strategy (V1)

| Scenario | Behaviour |
|----------|-----------|
| No network, view ledger | Show TanStack Query cache + "You're offline" toast |
| No network, log transaction | "You're offline — come back to log" toast. Block action. |
| No network, share page | "Connection required to load this page" message |
| Network restored | TanStack Query auto-refetches stale data |

No offline queue. No localStorage sync. No conflict resolution. V1.1 feature.

---

## 16. Auth Flows

### Email + Password
1. Sign up: name + email + password → Supabase creates `auth.users` row
2. Email OTP sent for verification
3. On first login: create `profiles` row (name, optional UPI ID)
4. Subsequent logins: standard email/password

### Google OAuth
1. One-tap sign in via Supabase Google provider
2. On first login: create `profiles` row, pre-fill name from Google profile
3. No domain restriction

### Onboarding (post-auth, first time only)
- Collect: display name (pre-filled if Google), UPI ID (optional), phone (optional)
- Phone is for UPI/WhatsApp context only — not used for auth
- Skip button allowed (UPI ID and phone can be added in Settings later)

---

## 17. File Structure

```
/
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
├── src/
│   ├── styles/
│   │   └── tokens.css              ← Mocha Premium tokens (light+dark)
│   ├── components/
│   │   ├── ui/                     ← Button, Input, BottomSheet, Avatar, Chip, Toast, Modal
│   │   │   └── ConfirmModal.tsx    ← Reusable delete confirmation modal
│   │   ├── layout/                 ← BottomNav, FAB, PageWrapper
│   │   ├── ledger/                 ← PersonCard, TransactionItem, BalanceBadge, HeroCard, ActivityItem
│   │   │   ├── LedgerRow.tsx       ← Single transaction/settlement row (date-grouped)
│   │   │   └── TransactionDetailSheet.tsx  ← Bottom sheet: details + ··· menu
│   │   ├── forms/                  ← AddTransaction, GroupSplit, LogSettlement, AddPerson
│   │   └── share/                  ← ShareableSummary (public, no auth)
│   ├── pages/
│   │   ├── Home.tsx                ← HeroCard + person list
│   │   ├── Groups.tsx              ← Group management
│   │   ├── Activity.tsx            ← Unified transaction+settlement timeline
│   │   ├── Person.tsx              ← Per-person ledger + pinned buttons (see Section 24)
│   │   ├── AddTransaction.tsx      ← Transaction logging + edit flow (transactionId prop = edit mode)
│   │   ├── Share.tsx               ← Public shareable summary (no auth, /s/[token])
│   │   ├── Settings.tsx            ← Profile, UPI ID, dark mode, buy coffee
│   │   ├── Login.tsx               ← Email/pass + Google OAuth
│   │   └── Onboarding.tsx          ← First-time profile setup
│   ├── store/
│   │   └── useUIStore.ts           ← Zustand: dark mode, toast, bottom sheet state
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client singleton
│   │   ├── balance.ts              ← UNIT TESTED. Single source of truth.
│   │   ├── upi.ts                  ← UPI deep-link + display mode
│   │   └── share.ts                ← Token gen + WhatsApp message builder
│   ├── hooks/
│   │   ├── usePersons.ts           ← TanStack Query: persons list + mutations
│   │   ├── useTransactions.ts      ← TanStack Query: transactions + mutations (create, edit, delete)
│   │   ├── useSettlements.ts       ← TanStack Query: settlements + mutations (create, edit, delete)
│   │   ├── useBalance.ts           ← Derived: getNetBalance per person, home totals, running balance
│   │   ├── useActivity.ts          ← Merged + sorted activity feed
│   │   └── useShare.ts             ← Share token create/delete
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── schema.sql                  ← Full schema (sections 3.1–3.7 above)
│   └── functions/
│       └── notify-owner/           ← Edge function: send email on "Something looks wrong?"
│           └── index.ts
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 18. Environment Variables

```env
# .env.example
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_APP_URL=https://yaari-khaatha.vercel.app
```

---

## 19. Supabase Free Tier — Pause Prevention

Supabase pauses projects after 7 days inactivity on free tier.

1. Register at cron-job.org (free)
2. Create cron job: `GET https://[project].supabase.co/rest/v1/persons?select=id&limit=1`
3. Header: `apikey: [your-anon-key]`
4. Schedule: every 5 days

---

## 20. Deployment Sequence

1. Create Supabase project → run `supabase/schema.sql` in SQL editor
2. Configure Supabase Auth: enable Email/password + Google OAuth
3. Deploy Edge Function: `supabase/functions/notify-owner/`
4. Set up cron-job.org ping (every 5 days)
5. Push to Vercel → set env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL)
6. Add PWA icons (192, 512, maskable)
7. Test end-to-end: auth → log tx → share link → UPI deep-link → settlement → revoke link

---

## 21. Testing Priorities

Unit tests in Vitest on `src/lib/`:

| Test | Cases |
|------|-------|
| `getNetBalance` | Zero balance, partial settlement (`they_paid`), full settlement (`they_paid`), `i_paid` reduces negative balance, overpayment (negative result), mixed directions |
| `getBalanceDirection` | Positive → owes_me, Negative → i_owe, Zero → settled |
| `formatCurrency` | Integer rupees, decimal rupees, negative paise (abs output) |
| `equalSplit` | ₹100/3=[3334,3333,3333], ₹10/2=[500,500], sum always equals input; ₹480/4=[12000,12000,12000,12000] — numPeople includes payer |
| `isOverpayment` | Amount > abs(balance) → true, amount <= abs(balance) → false |
| `buildUPILink` | Valid URL format, correct paise→rupee conversion, note fallback |
| `getTokenExpiresAt` | Returns date exactly 30 days in future |

---

## 22. Person Detail Page — Layout & Interaction Spec

### 22.1 Page Layout

```
┌─────────────────────────────────────┐
│  ←  Rahul                  [share]  │  ← header: back + person name + share icon
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Rahul owes you   ₹1,240   │    │  ← balance card (--color-positive or --color-accent)
│  └─────────────────────────────┘    │
│                                     │
│  ── 3 Jun 2026 · Today ──────────  │  ← date group header
│  ● Domino's order        ₹120  →   │
│    Group split · 4 people           │
│                                     │
│  ── 1 Jun 2026 ───────────────────  │
│  ● Auto to airport       ₹200  →   │
│    You paid                         │
│  ✓ Settled — UPI          ₹300  ←  │
│    "sent on gpay"                   │
│                                     │
│  ┌────────────────┬──────────────┐  │
│  │  + Add Expense │  Settle Up   │  │  ← pinned buttons (always visible)
│  └────────────────┴──────────────┘  │
└─────────────────────────────────────┘
```

**FAB: hidden on this page.** Pinned buttons replace it entirely.

### 22.2 Pinned Action Buttons

| Button | Color | Action |
|--------|-------|--------|
| `+ Add Expense` | `--color-accent` (orange) | Navigate to `AddTransaction.tsx` with `personId` pre-selected and locked |
| `Settle Up` | `--color-positive` (green) | Open `LogSettlement` bottom sheet with `amount` pre-filled to `Math.abs(getNetBalance())` |

**`Settle Up` disabled state:** If `getBalanceDirection() === 'settled'`, show toast: *"You're already settled up with Rahul!"* Do not open sheet.

### 22.3 Ledger History — Row Anatomy

All entries in the ledger list are grouped by date with a section header. No date shown on the row itself.

**Date group header** (`--color-text-tertiary`, 12px, uppercase, `+0.08em` letter-spacing):
```
── 3 Jun 2026 · Today ──
── 1 Jun 2026 ──────────
```
*"· Today"* appended only if the date is the current date.

**Transaction row:**

| Element | Spec |
|---------|------|
| Left icon | Filled circle dot: `--color-positive` for `owes_me`, `--color-accent` for `i_owe` |
| Primary line | Note text (truncated ~35 chars) + right-aligned amount in direction color |
| Secondary line | Context string, `--color-text-tertiary`, 12px |

Context string values:
- Direct IOU, I paid → *"You paid"*
- Direct IOU, they paid → *"They paid"*
- Group split, I paid → *"Group split · N people"*
- Group split, they paid → *"Group split · N people · They paid"*

**Settlement row:**

| Element | Spec |
|---------|------|
| Left icon | `✓` checkmark, `--color-text-tertiary` (grey — settlements are neutral) |
| Primary line | Note (if exists) or *"Settled"* + ` — ` + method (Cash / UPI / Other) + right-aligned amount |
| Secondary line | *"They paid you back"* or *"You paid them back"* |

**Tap behaviour:** Any row tap → opens Transaction Details Bottom Sheet (see 22.4).

### 22.4 Transaction Details Bottom Sheet

Slides up from bottom. Dismissable via swipe-down or backdrop tap.

```
┌─────────────────────────────────────┐
│  DIRECT IOU                  [···]  │  ← entry type label + options menu
│                                     │
│  ₹480                               │  ← amount (20px, 600)
│  You gave · Rahul owes you          │  ← direction label (colored)
│                                     │
│  Note: Domino's order               │  ← shown only if note exists
│  Date: 3 Jun 2026                   │
│                                     │
│  Running balance after this: ₹480  │  ← always shown
└─────────────────────────────────────┘
```

**Entry type label** (top-left, `--color-text-tertiary`, 12px, uppercase):
`DIRECT IOU` · `GROUP SPLIT` · `SETTLEMENT`

**Direction label wording:**

| Scenario | Label | Color |
|----------|-------|-------|
| Transaction, `owes_me` | *"You gave · Rahul owes you"* | `--color-positive` |
| Transaction, `i_owe` | *"You got · You owe Rahul"* | `--color-accent` |
| Settlement, `they_paid` | *"They paid you back"* | `--color-positive` |
| Settlement, `i_paid` | *"You paid Rahul back"* | `--color-accent` |

**Running balance line:** Cumulative net balance *after* this entry, computed client-side in chronological order. Coloured by `getBalanceDirection()` on the result. Label: *"Running balance after this: ₹X"*

**··· options menu** (top-right): tapping opens a small action sheet with:
- `Edit` — **hidden for Group Split** transactions. Shown for Direct IOU and Settlements only.
- `Delete` — always shown, `--color-error` (red text)

### 22.5 Edit Flow

**Entry point:** ··· menu → Edit (Direct IOU and Settlements only — never shown for Group Splits)

**Direct IOU edit:**
- Navigate to `AddTransaction.tsx` with `transactionId` prop + `initialValues` pre-filled
- Page title: *"Edit Transaction"*
- Submit button label: *"Save Changes"*
- All fields editable: amount, note, date, direction (I Paid / They Paid)
- **Direction change warning:** If user toggles direction chip, show an inline warning banner below the chips before allowing submit:
  > *"Changing direction will flip the balance. Rahul will go from owing you ₹200 to you owing Rahul ₹200."*
  > Warning stays visible until user reverts direction OR taps *"Yes, change it"* to confirm. Submit blocked until confirmed.
- On save: `UPDATE transactions` + `UPDATE transaction_persons` (direction + share_amount_paise) → `queryClient.invalidateQueries` for this person

**Settlement edit:**
- Open `LogSettlement` bottom sheet with `settlementId` prop + `initialValues` pre-filled
- Submit button label: *"Save Changes"*
- Editable fields: amount, method, note, date
- `direction` not shown — always auto-derived, never user-entered
- On save: `UPDATE settlements` → `queryClient.invalidateQueries` for this person

**Reuse rule:** `AddTransaction.tsx` accepts optional `transactionId` prop. If present → edit mode (pre-fill, change title + button). `LogSettlement` accepts optional `settlementId` prop. Same pattern. **Do not create separate EditTransaction or EditSettlement components.**

### 22.6 Delete Flow

**Entry point:** ··· menu → Delete (always available for all entry types)

**Confirmation modal** (separate modal on top of the bottom sheet):

```
┌──────────────────────────────────────┐
│  Delete this transaction?            │
│                                      │
│  Domino's order · ₹480              │  ← entry summary
│  3 Jun 2026                          │
│                                      │
│  This can't be undone.               │
│                                      │
│  [ Cancel ]         [ Delete ]       │
│                      --color-error   │
└──────────────────────────────────────┘
```

For Group Split entries, additional note in modal body:
> *"Deleting this group split will remove all associated shares. Each person's balance will update automatically."*

**On confirm:**
- `DELETE FROM transactions WHERE id = [id]` — cascades to `transaction_persons` via FK
- OR `DELETE FROM settlements WHERE id = [id]`
- Dismiss bottom sheet + modal
- `queryClient.invalidateQueries` for this person → balance recomputes automatically
- Show success toast: *"Transaction deleted"* or *"Settlement deleted"*

---

## 23. V1 Excludes (Do Not Build)

| Feature | When |
|---------|------|
| Custom splits (per-person amounts) | V1.1 |
| Natural language input ("Rahul owes 200") | V2 |
| Mutual ledger (both parties log entries) | V3 |
| `linked_user_id` matching UI | V3 |
| Spending analytics / categories | Phase 2 |
| Push notifications | V2 |
| Offline sync engine | V1.1 |
| Supabase RPC for balance aggregation | V1.1 |
| Splitwise-style row model (everyone gets a row) | V3 |
| Bank/UPI statement import | Needs RBI license |
| Payment processing | Needs RBI license |
| App Store / Play Store | PWA first |
| Monetization | Post-traction |
| Rate limiting | V1.1 |
| Custom domain | Post-traction |

---

---

## 24. Closed Decisions Log

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | App name | Yaari Khaatha |
| 2 | Auth | Email/password + Google OAuth + email OTP |
| 3 | Language | TypeScript, relaxed config |
| 4 | State | TanStack Query v5 + Zustand |
| 5 | Data model | One-sided + linked_user_id (V3) |
| 6 | Offline | Read-only TanStack Query cache |
| 7 | Splits | Equal only, first N get +1 paise remainder |
| 8 | Share expiry | 30 days + manual revocation |
| 9 | Share domain | Vercel subdomain |
| 10 | Monetization | None. "Buy me a chai" only |
| 11 | Palette | Mocha Premium, light+dark |
| 12 | Typography | DM Sans, min 12px |
| 13 | Nav | 4 tabs + FAB center |
| 14 | Styling | Tailwind CSS v4 |
| 15 | Balance display | formatCurrency = absolute; getBalanceDirection = color/label |
| 16 | Overpayment | Warn + confirm, allow, balance flips direction |
| 17 | is_settled | Auto UI hint only, never used in balance calc |
| 18 | third_party paid_by | In schema, hidden from V1 UI |
| 19 | Group split rows | Non-payers only, payer gets no row |
| 20 | Home aggregation | Client-side, 2 queries, TanStack Query cache |
| 21 | Activity feed | Two fetches merged + sorted client-side |
| 22 | UPI display (share page) | Device-adaptive: Android=deeplink, iOS=QR, Desktop=both |
| 23 | "Something wrong?" | Supabase Edge Function → email to owner |
| 24 | Share token gen | nanoid(8) |
| 25 | Settlement direction | `direction` column on settlements: `they_paid` / `i_paid`. Auto-derived from current balance — never user-entered. |
| 26 | Home settled display | Active balances default visible; settled friends in collapsed section. `showSettled` boolean in Zustand. |
| 27 | Missing UPI ID | Share page: hide all UPI UI, show plain text. Home: dismissable nudge below hero card → Settings. |
| 28 | Empty states | All 3 screens get inline SVG illustrations + heading + body. Home: accent CTA + FAB pulse. Groups: accent CTA. Activity: no CTA. Pure SVG only. |
| 29 | Transaction edit scope | Direct IOU + Settlement only. Group splits = delete + re-log in V1. |
| 30 | Details view trigger | Tap any transaction/settlement row in person ledger → opens bottom sheet |
| 31 | Details sheet content | Entry type label, amount, direction label ("You gave/got" framing), note, date, running balance after entry, ··· options menu |
| 32 | Person detail pinned buttons | `[ + Add Expense ]` (accent) and `[ Settle Up ]` (positive). Splitwise vocabulary. |
| 33 | FAB on person detail page | Hidden entirely — pinned buttons replace it |
| 34 | `[ + Add Expense ]` action | Navigate to AddTransaction.tsx with personId pre-selected and locked |
| 35 | `[ Settle Up ]` action | Open LogSettlement bottom sheet, amount pre-filled to Math.abs(getNetBalance()). If already settled → toast only. |
| 36 | Edit fields — Direct IOU | All editable: amount, note, date, direction. Direction change shows inline warning banner; submit blocked until confirmed. |
| 37 | Edit fields — Settlement | Editable: amount, method, note, date. Direction not shown — always auto-derived. |
| 38 | Ledger row design | Date-grouped section headers ("3 Jun 2026 · Today"). Colored dot icon. Note + amount on primary line. Context on secondary line. No running balance in row — lives in details sheet only. |
| 39 | Edit component reuse | AddTransaction.tsx accepts optional `transactionId` prop (edit mode). LogSettlement accepts optional `settlementId` prop. No separate edit components. |
| 40 | Delete confirmation | Separate modal on top of details sheet. Shows entry summary + "This can't be undone." Cancel + Delete (--color-error). On confirm: CASCADE DELETE → queryClient.invalidateQueries → success toast. |
