# Technical Specification
## Project: Yaari Khaatha
**Version:** 0.3
**Author:** Himanshu Saini
**Status:** Ready to build
**Last updated:** June 2026

---

## Changelog
| Version | Change |
|---------|--------|
| 0.1 | Initial draft with PocketBase/Railway |
| 0.2 | Backend → Supabase + Vercel. Cron ping added. Design tokens added. |
| 0.3 | Settlo → Yaari Khaatha. TS, TanStack Query v5, Tailwind v4, Mocha Premium (light/dark), updated typography, 4-tab + FAB nav, email/password + Google OAuth, linked_user_id, equal splits, read-only offline. |

---

## 1. Technology Stack

### Frontend
| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + Vite | Fast HMR, familiar |
| Language | TypeScript (relaxed) | Type safety, low friction |
| Styling | Tailwind CSS v4 | `@theme` tokens, CSS-native |
| State (server) | TanStack Query v5 | Caching, refetching, optimistic updates |
| State (UI) | Zustand | Lightweight, low boilerplate |
| PWA | vite-plugin-pwa | Service worker + manifest, installable |
| Routing | React Router v6 | Standard, stable |
| Icons | Lucide React | Clean, lightweight |
| Font | DM Sans (Google Fonts) | Geometric, warm |
| QR Code | qrcode.react | Client-side UPI QR |

### Backend
| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | Supabase | PostgreSQL, RLS, Auth built-in |
| Database | PostgreSQL | Relational, correct for ledger |
| Auth | Email/pass + Google OAuth | Email OTP (no SMS cost) |
| Host — Frontend | Vercel | Free, fast |
| Host — Backend | Supabase free | Pinged by cron-job.org |

### TypeScript Configuration
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

All files `.ts` / `.tsx`. No `.js` / `.jsx`.

### Supabase Free Tier — Pause Prevention
Supabase pauses after 7 days inactivity. Fix:
1. Register cron-job.org account.
2. Ping Supabase REST URL every 5 days.
3. Path: `GET https://[project].supabase.co/rest/v1/persons?select=id&limit=1`
4. Add your `anon` key as `apikey` header

---

## 2. Database Schema

### profiles (extends Supabase Auth)
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

### persons
No app install needed.
```sql
create table persons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  label text,
  phone text,
  upi_id text,
  linked_user_id uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

alter table persons enable row level security;
create policy "Users can CRUD own persons"
  on persons for all using (auth.uid() = user_id);
```

### Person Identity & Duplicate Management
- **Display logic**: Show `label` if set, else `name` (which remains the real name).
- **Duplicate detection rule**: On person creation, if another person with the same name already exists in the user's ledger, warn the user and force a `label` entry (e.g. "Rahul Hostel") before saving. Do not warn or prompt label for unique names.
- **Share page rule**: Public shareable summary (`/s/[token]`) always uses `name` (real name), never `label`.
- **V3 linked_user_id matching rule**: Never auto-match by name alone. Match by phone or email, always show confirmation UI before linking.

### groups
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

### transactions
Amounts in paise (integers).
```sql
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  paid_by text check (paid_by in ('me', 'them', 'third_party')) not null,
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

### transaction_persons
Junction table tracking involved people and shares.
```sql
create table transaction_persons (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references transactions on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  share_amount_paise integer not null check (share_amount_paise > 0),
  direction text check (direction in ('owes_me', 'i_owe')) not null,
  is_settled boolean default false,
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

### settlements
Repayments in paise.
```sql
create table settlements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  amount_paise integer not null check (amount_paise > 0),
  direction text check (direction in ('i_paid', 'they_paid')) not null,
  method text check (method in ('cash', 'upi', 'other')) default 'cash' not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table settlements enable row level security;
create policy "Users can CRUD own settlements"
  on settlements for all using (auth.uid() = user_id);
```

### share_tokens
Read-only links. Live data, no expiry.
```sql
create table share_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references persons on delete cascade not null,
  token text unique not null,
  expires_at timestamptz not null, -- ALWAYS set to created_at + 30 days
  created_at timestamptz default now()
);

alter table share_tokens enable row level security;
create policy "Anyone can read share tokens"
  on share_tokens for select using (true);
create policy "Users can manage own tokens"
  on share_tokens for all using (auth.uid() = user_id);
```

---

## 3. Balance Calculation Logic

**Stored and computed as integers (paise). No floats.**

```typescript
// src/lib/balance.ts — single source of truth

export interface TransactionPerson {
  direction: 'owes_me' | 'i_owe'
  share_amount_paise: number
}

export interface Settlement {
  amount_paise: number
  direction: 'i_paid' | 'they_paid'
}

/**
 * Get net balance with a person.
 * Positive = they owe me. Negative = I owe them.
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
      ? acc - s.amount_paise
      : acc + s.amount_paise
  }, 0)

  return txBalance + settlementSum
}

/**
 * Equal split — handles rounding correctly.
 * ₹100 among 3 people = [3334, 3333, 3333] paise.
 */
export function equalSplit(totalPaise: number, numPeople: number): number[] {
  const base = Math.floor(totalPaise / numPeople)
  const remainder = totalPaise % numPeople
  return Array.from({ length: numPeople }, (_, i) =>
    i < remainder ? base + 1 : base
  )
}

/**
 * Format paise as Indian rupee string.
 * ALWAYS returns absolute value — no minus sign.
 * 34050 → "₹340.50", -30000 → "₹300"
 */
export function formatCurrency(paise: number): string {
  const rupees = Math.abs(paise) / 100
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
```

---

## 4. UPI Deep-Link + QR Spec

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

export type UPIDisplayMode = 'deeplink' | 'qr' | 'copy'

export function getUPIDisplayMode(): UPIDisplayMode {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'deeplink'
  if (/iphone|ipad/i.test(ua)) return 'qr'
  return 'copy'
}
```

QR code rendered client-side using `qrcode.react`:
```tsx
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG value={upiDeepLink} size={200} />
```

---

## 5. Shareable Summary — Token Flow

```
User taps "Share with Rahul"
  → Generate token: nanoid(8) — URL-safe, short
  → Insert into share_tokens table
  → Return URL: [VITE_APP_URL]/s/[token]
  → User shares via WhatsApp (pre-written message) or copies link

Recipient opens [url]/s/[token] (no login)
  → Public Supabase RPC call: get_public_ledger(token_val)
  → Validate: token exists and expires_at > now() (30 days limit)
  → Fetch: LIVE ledger data securely — owner name, person name (always real name, never label), transactions, settlements
  → Render: read-only ShareableSummary component
  → Show: UPI deep-link button + QR code based on platform
  → "Something looks wrong?" → sends notification to ledger owner
```

> [!IMPORTANT]
> **Share page name display**: The public shareable summary (`/s/[token]`) always uses the person's real `name` from the database, never the `label` (disambiguation display name).

---

## 6. WhatsApp Share Message

```typescript
// src/lib/share.ts

import { formatCurrency } from '@/lib/balance'

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

export function buildShareURL(token: string): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseUrl}/s/${token}`
}
```

---

## 7. PWA Configuration

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

## 8. Offline Strategy (V1)

**Read-only offline.** TanStack Query handles caching.

| Scenario | Behaviour |
|----------|-----------|
| No network, view ledger | Show cache + "Offline" toast |
| No network, log tx | "You're offline" toast |
| No network, share page | "Connection required" message |
| Network restored | Auto-refetch stale data |

No offline queue/sync in V1.

---

## 9. Visual Design Tokens — Mocha Premium

```css
/* src/styles/tokens.css — using Tailwind v4 @theme */
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-bg:           #F3EDE6;
  --color-card:         #FEFCF9;
  --color-hero:         #1A1613;

  /* Brand */
  --color-accent:       #C4470A;
  --color-positive:     #167A33;

  /* Text */
  --color-text-primary:   #1A1613;
  --color-text-secondary: #6D5F51;
  --color-text-tertiary:  #A49484;
  --color-text-on-hero:   #FEFCF9;
  --color-text-on-accent: #FFFFFF;

  /* Borders */
  --color-border:    #DDD5CA;
  --color-divider:   #EBE4DB;

  /* Feedback */
  --color-error:     #B91C1C;
  --color-success:   #167A33;

  /* Avatar */
  --color-avatar-bg:   #2C241C;
  --color-avatar-text: #FEFCF9;

  /* Shadows */
  --shadow-card: 0 2px 8px rgba(26, 22, 19, 0.07),
                 0 1px 2px rgba(26, 22, 19, 0.04);
  --shadow-cta:  0 4px 14px rgba(196, 71, 10, 0.35);

  /* Typography */
  --font-sans: 'DM Sans', sans-serif;

  /* Border radius */
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

---

## 10. Project File Structure

```
/
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
├── src/
│   ├── styles/
│   │   └── tokens.css          ← Mocha Premium tokens (light+dark)
│   ├── components/
│   │   ├── ui/                 ← Button, Input, BottomSheet, Avatar, Chip
│   │   ├── layout/             ← BottomNav, FAB, PageWrapper
│   │   ├── ledger/             ← PersonCard, TransactionItem, BalanceBadge, HeroCard
│   │   ├── forms/              ← AddTransaction, GroupSplit, LogSettlement
│   │   └── share/              ← ShareableSummary (public, no auth)
│   ├── pages/
│   │   ├── Home.tsx            ← HeroCard + person list
│   │   ├── Groups.tsx          ← Group management
│   │   ├── Activity.tsx        ← Transaction timeline
│   │   ├── Person.tsx          ← Per-person ledger + history
│   │   ├── AddTransaction.tsx  ← Transaction logging flow
│   │   ├── Share.tsx           ← Public shareable summary (no auth)
│   │   └── Settings.tsx        ← Profile, dark mode, buy coffee
│   ├── store/
│   │   └── useUIStore.ts       ← Zustand — UI-only state
│   ├── lib/
│   │   ├── supabase.ts         ← Supabase client singleton
│   │   ├── balance.ts          ← Balance calculation — UNIT TESTED
│   │   ├── upi.ts              ← UPI deep-link + QR builder
│   │   └── share.ts            ← Share token + WhatsApp message builder
│   ├── hooks/
│   │   ├── useTransactions.ts  ← TanStack Query hooks
│   │   ├── usePersons.ts
│   │   └── useBalance.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── schema.sql              ← Full schema — run in Supabase SQL editor
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 11. Environment Variables

```env
# .env.example
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_APP_URL=https://yaari-khaatha.vercel.app
```

---

## 12. Deployment

| Service | What | Cost |
|---------|------|------|
| Vercel | React PWA frontend | Free |
| Supabase | Database + Auth + RLS | Free |
| cron-job.org | Pause prevention | Free |

**Deploy sequence:**
1. Create Supabase project, run `supabase/schema.sql` in editor.
2. Set up cron-job.org ping (every 5 days to Supabase REST URL).
3. Config Supabase Auth (email/pass + Google).
4. Push to Vercel + set env variables.
5. Setup PWA assets.
6. Test end-to-end.

---

## 13. Testing Priorities

1. **Balance calculations** — partial settlements, group splits, zero balances.
2. **Rounding** — ₹100 / 3 = [3334, 3333, 3333].
3. **UPI deep-link formats** — PhonePe, GPay, Paytm.
4. **Share tokens** — public query restriction.
5. **Offline cached reads**.

Use Vitest for unit tests on `src/lib/balance.ts`, `src/lib/upi.ts`, `src/lib/share.ts`.
