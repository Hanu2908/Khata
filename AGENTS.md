# AGENTS.md — Yaari Khaatha
> Single source of truth. Keep updated.

## Identity
PWA for Indian college students — track informal give-take transactions with friends. Personal social khata, not budgeting app.

**Value prop:** See who owes you what instantly. Friends don't need app.
**Differentiator:** Shareable summary link via WhatsApp — read-only ledger + UPI deep-link + QR to pay.
**Pitch:** "Log who owes you in 3 taps. Share pay link on WhatsApp. They don't need app."
**Landing page:** Public marketing page at `/`. Converts visitors → signups. Sections: Hero, App Preview, How It Works, Why Yaari Khaatha, Footer.

## Target User
Indian college students 18–23. UPI-native, cash too. Daily shared expenses (food, auto, chai). Won't install apps for friends.

## Stack (locked)
| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| Language | TypeScript (relaxed) |
| Styling | Tailwind CSS v4 |
| State (server) | TanStack Query v5 |
| State (UI) | Zustand |
| Routing | React Router v6 |
| Icons | Lucide React |
| Font | DM Sans |
| QR | qrcode.react |
| PWA | vite-plugin-pwa |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Email/password + Google OAuth + email OTP |
| Deploy | Vercel (frontend), Supabase Cloud (backend) |

No Firebase/PocketBase/MongoDB. No React Native. Ask before adding deps.

## TypeScript
Relaxed V1: `strict: false`, `noImplicitAny: false`. All `.ts`/`.tsx`. Tighten later.
No `.js`/`.jsx`.

## Auth
1. Email + password — email OTP verification
2. Google OAuth — open, no domain restriction
3. Optional phone — onboarding, UPI/WhatsApp context

## Data Model — One-sided (V1)
Khatabook-style: own your ledger. `linked_user_id` on `persons` for V3.

### Tables
- **profiles** — id, name, upi_id?, created_at
- **persons** — id, user_id, name, label?, phone?, upi_id?, linked_user_id?, created_at
- **transactions** — id, user_id, paid_by, amount_paise, note, date, type, group_id?, created_at
- **transaction_persons** — id, transaction_id, person_id, share_amount_paise, direction, is_settled
- **settlements** — id, user_id, person_id, amount_paise, direction, method, note, date, created_at
- **groups** + **group_persons** — group management
- **share_tokens** — id, user_id, person_id, token, expires_at, created_at

## Critical Rules

### 1. Money = paise integers — no exceptions
```typescript
const amountPaise = 34050; // = ₹340.50
function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
```

### 2. Balance calc = single source of truth
```typescript
import { getNetBalance, equalSplit, formatCurrency } from '@/lib/balance';
// Positive = they owe me. Negative = I owe them.
```

### 3. Equal split = integer arithmetic
```typescript
function equalSplit(totalPaise: number, numPeople: number): number[] {
  const base = Math.floor(totalPaise / numPeople);
  const remainder = totalPaise % numPeople;
  return Array.from({ length: numPeople }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}
```

### 4. Logging speed < 3 taps / 10 seconds
### 5. Tone = friendly, never formal ("owes you" not "debt")
### 6. No payment processing — UPI deep-link + QR only
### 7. Accent color = CTA only (negative amounts use --color-negative)
### 8. Supabase client = singleton (`@/lib/supabase`)

### 9. Person Identity & Duplicate Management
- **Display logic**: Show `label` if set, else `name` (which remains the real name).
- **Duplicate detection**: On person creation, if another person with the same name already exists in the user's ledger, warn the user and force a `label` entry (e.g. "Rahul Hostel") before saving. Do not warn or prompt label for unique names.
- **Share page rule**: Public shareable summary (`/s/[token]`) always uses `name` (real name), never `label`.
- **V3 linked_user_id matching**: Never auto-match by name alone. Match by phone or email, always show confirmation UI before linking.

## Design — Mocha Premium

### Light Mode
```css
--color-bg: #F3EDE6; --color-card: #FEFCF9; --color-hero: #1A1613;
--color-accent: #C4470A; --color-positive: #167A33; --color-negative: #9B4040;
--color-text-primary: #1A1613; --color-text-secondary: #6D5F51;
--color-text-tertiary: #76695B; --color-text-on-hero: #FEFCF9;
--color-border: #DDD5CA; --color-divider: #EBE4DB;
--color-error: #B91C1C; --color-success: #167A33;
--color-avatar-bg: #2C241C; --color-avatar-text: #FEFCF9;
```

### Dark Mode
```css
--color-bg: #12100D; --color-card: #1D1915; --color-hero: #FEFCF9;
--color-accent: #E05A1A; --color-positive: #3BD870; --color-negative: #E05C5C;
--color-text-primary: #EDE8E0; --color-text-secondary: #968778;
--color-text-tertiary: #968778; --color-text-on-hero: #1A1613;
--color-border: #2A241E; --color-divider: #201C18;
--color-error: #EF4444; --color-success: #3BD870;
--color-avatar-bg: #2C241C; --color-avatar-text: #FEFCF9;
```

### Typography — DM Sans
| Element | Size | Weight | Spacing |
|---------|------|--------|---------|
| Hero balance | 32px | 600 | -1px |
| Section heading | 12px | 500 | +0.08em uppercase |
| Person name | 16px | 500 | -0.1px |
| Balance (list) | 15px | 600 | -0.3px |
| Note/subtitle | 13px | 400 | 0 |
| Timestamp/hint | 12px | 400 | 0 |
| CTA button | 15px | 600 | +0.01em |

Min text: 12px. Primary interactive: 16px.

## Nav

### Mobile + Tablet (`< 1024px`) — Bottom Nav
```
[ 🏠 Home ] [ 👥 Groups ] [ ➕ FAB ] [ 📋 Activity ] [ ⚙️ Settings ]
```

### Desktop (`≥ 1024px`) — Left Sidebar (240px)
```
┌──────────────────────┐
│  🟠 Yaari Khaatha    │
├──────────────────────┤
│  🏠  Home            │
│  👥  Groups          │
│  📋  Activity        │
│  ⚙️  Settings        │
├──────────────────────┤
│  [ + New Transaction]│  ← accent button, replaces FAB
├──────────────────────┤
│  [avatar]  Name      │  ← user profile, bottom (X.com style)
└──────────────────────┘
```

Person detail on desktop = two-column (person list left, ledger right). Mobile = full-page drill-down.

## Conventions
- Functional components + hooks
- TypeScript throughout, relaxed config
- Tailwind v4, `@theme` for tokens, `@/` alias
- TanStack Query for Supabase data, Zustand for UI
- All Supabase calls in try/catch, skeleton loaders
- Money = paise, always `formatCurrency()`

## Responsive Design
Mobile-first. Most users on phones. But app is fully responsive across all screen sizes.

| Breakpoint | Layout |
|------------|--------|
| `< 640px` | Bottom nav, FAB, full-width cards |
| `640–1023px` | Bottom nav, max-w-600px centered |
| `≥ 1024px` | Left sidebar 240px + main content max-w-800px |

**Key rules:**
- `AppLayout.tsx` = single responsive shell for all app pages. Sidebar on `lg:`, bottom nav on `<lg`.
- `PageWrapper.tsx` = `max-w-[800px] mx-auto` for all content.
- Landing page has own layout (not `AppLayout`). Max-w-1200px.
- Bottom sheets → centered modals on `lg+`. Same component, responsive CSS.
- No separate mobile/desktop page components. Use `lg:` Tailwind prefixes.
- `pb-24` on mobile (bottom nav clearance), `pb-6` on desktop.

## V1 Excludes
Custom splits, offline sync, rate limiting, custom domain, monetization arch, NLP input, push notifs, categories, mutual ledger, analytics, payment processing, app store.

## Routes
| Route | Page | Auth |
|-------|------|------|
| `/` | Landing.tsx | Public. Redirect to `/home` if session. |
| `/login` | Login.tsx | Public |
| `/onboarding` | Onboarding.tsx | Protected (session required, profile incomplete) |
| `/home` | Home.tsx | Protected |
| `/groups` | Groups.tsx | Protected |
| `/activity` | Activity.tsx | Protected |
| `/person/:id` | Person.tsx | Protected |
| `/add` | AddTransaction.tsx | Protected |
| `/settings` | Settings.tsx | Protected |
| `/s/[token]` | Share.tsx | Public (no auth) |

## Decisions
| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Name | Yaari Khaatha |
| 2 | Auth | Email/password + Google OAuth + email OTP |
| 3 | Language | Pure TypeScript, relaxed |
| 4 | State | TanStack Query v5 + Zustand |
| 5 | Data model | One-sided + linked_user_id |
| 6 | Offline | Read-only cache |
| 7 | Scope | Pure give-take |
| 8 | Share | Vercel subdomain, live data, nanoid |
| 9 | Monetization | None. "Buy coffee" only |
| 10 | Palette | Mocha Premium, light+dark |
| 11 | Typography | DM Sans, min 12px |
| 12 | Nav | 4 tabs + FAB |
| 13 | Styling | Tailwind v4 |
| 14 | Splits | Equal only V1 |
| 15 | Landing page | `/` route, 5 sections, dual CTA hero |
| 16 | Responsive | Mobile-first. `<640` bottom nav, `≥1024` left sidebar |
| 17 | Desktop nav | Left sidebar 240px, user profile at bottom |
| 18 | Desktop content width | max-w-[800px] centered |
| 19 | Person detail desktop | Two-column layout |
| 20 | Bottom sheets desktop | Centered modal via responsive CSS, same component |

## Session Checklist
1. Building Yaari Khaatha — social khata PWA
2. Developer = first-year CSE student, small team
3. Readable code over clever code
4. Ask before adding deps
5. Money = paise integers. Always.
6. Flag out-of-scope features, refuse politely
