# Product Requirements Document
## Project: Yaari Khaatha
**Version:** 0.3 — Post-grill decisions locked
**Author:** Himanshu Saini
**Status:** Ready to build
**Last updated:** June 2026

---

## Changelog
| Version | Change |
|---------|--------|
| 0.1 | Initial draft |
| 0.2 | Title → Settlo. 5 decisions closed. Design tokens added. Backend = Supabase. No categories in V1. |
| 0.3 | Settlo → Yaari Khaatha. 14 decisions locked: TS, TanStack Query + Zustand, Tailwind v4, Mocha Premium (light/dark), updated typography, 4-tab + FAB nav, email/password + Google OAuth, one-sided model + linked_user_id, equal splits only, read-only offline, UPI QR on share page. |

---

## 1. Problem Statement

Indian college students have daily informal transactions (food, auto, group orders) with friends. No lightweight, cultural tool. Result: forgotten debt, social friction, zero visibility.

Splitwise paywalled, requires friend install, no UPI. Khatabook/OkCredit for shops. Notebooks/mental track have high forget rate. WhatsApp awkward.

Yaari Khaatha: cash/UPI equal, solo use, friend no install, <3-tap log for ₹20–500 transactions, friendly tone.

---

## 2. Goal

Frictionless financial memory for Indian college students. Start with informal transaction track. Generate data infra for personal finance intelligence.

**Entry point is give-take ledger. All else downstream.**

---

## 3. Target User

**Primary:** Indian college students, 18–23, Tier 1–3 cities
**Secondary:** Young professionals, 22–28, first job

**User profile:**
- Income: Pocket money (₹3,000–15,000/month) + gigs. Irregular.
- Payments: UPI-native (PhonePe, GPay) + cash. Both equal.
- Social: Tight friend groups, daily shared expenses. No formal invoices.
- Pain: Net amount owed unknown.
- Status quo: Mental track, absorb losses, awkward WhatsApp.

**Non-target (v1):**
- Shop owners (Khatabook)
- Rent/utility splitters (Splitwise)
- Immediate settlers

---

## 4. Core Insight

Merchant khata model culturally proven. Khatabook built big business for shop credit. No social equivalent for student peer P2P. That is gap.

---

## 5. Product Vision — Phased Roadmap

### Phase 1 — Financial Memory (v1, current focus)
**Goal:** Reliable record of who owes what.
**Core question:** "What net position with each person now?"

### Phase 2 — Financial Visibility
**Goal:** Surface spending patterns.
**Core question:** "Where money go each month?"

### Phase 3 — Financial Control
**Goal:** Spend less on regrets.
**Core question:** "How spend less on bad choices?"

### Phase 4 — Financial Awareness
**Goal:** Connect emotions to spending.
**Core question:** "Why spend this way?"

---

## 6. V1 Scope — Phase 1 Only

### 6.1 Core Objects

| Object | Description |
|--------|-------------|
| **Person** | Transact target. Name, opt UPI ID, opt phone. No app install needed. |
| **Transaction** | Financial event. Amount, paid_by, parties, note, date. No category. |
| **Settlement** | Repayment. Reduce balance. Full or partial. |
| **Group** | Opt group for recurring splits. Equal split only. |

### 6.2 Core Flows — V1

**Flow 1: Log direct IOU**
> "I paid ₹200 for Priya's auto."
→ Add person (if new) → Enter amount + note → Confirm direction → Done. <3 taps.

**Flow 2: Log group split (equal only)**
> "I paid ₹480 for group Domino's, 4 people, equal split."
→ Select/create group → Enter total + paid_by → Equal split auto-calculated → Confirm → Done.

**Flow 3: Log settlement**
> "Rahul paid me back ₹300 of the ₹480 he owes."
→ Open Rahul ledger → Tap "Settle" → Enter amount → Mark cash/UPI → Update balance.

**Flow 4: View per-person ledger**
> Tx history, running balance, settlements, share button.

**Flow 5: Generate shareable summary**
> Read-only link. Recipient no login. Show balance, transactions, UPI deep-link, QR code, correction button.

### 6.3 Input Model

Hybrid text + chips:
```
[ paid ₹___ for ___ ]
  [Food] [Auto] [Chai] [Other]
  [Split equally] [I paid] [They paid]
```
Note field optional. Speed primary.
Natural language parse: V2.
Custom splits: V1.1.

### 6.4 Home Screen — Primary Information Architecture

**Decided: Split display.**
Top: **"People owe you ₹X"** (large, primary driver)
Below: **"You owe ₹Y"** (smaller, secondary)
Net balance: one tap deep.
Unsettled count: supporting detail only.

Rationale: Net hides debt. Rahul owes you ₹500, you owe Priya ₹480 -> net ₹20 (meaningless). Separate display drives action.

### 6.5 Authentication

**Flows:**
1. **Email + password** — Sign up/login. Email OTP verify (no SMS).
2. **Google OAuth** — One-tap. Open (no domain block).
3. **Opt phone** — Onboard collect for UPI/WhatsApp. No auth.

### 6.6 Navigation

Bottom nav — 4 tabs + FAB. Mobile-first.
```
[ 🏠 Home ]  [ 👥 Groups ]  [ ➕ FAB ]  [ 📋 Activity ]  [ ⚙️ Settings ]
```
- **Home** — Hero card + person list
- **Groups** — Group split manage
- **+ FAB** — Log transaction (raised center)
- **Activity** — Timeline across all persons
- **Settings** — Profile, UPI ID, dark mode, buy coffee

Person detail: Drill-down from Home.

### 6.7 Shareable Summary — Design Spec

**URL:** `[VITE_APP_URL]/s/[nanoid-token]` — no login to view
**Expiry:** None. Live data.
**Tone:** Neutral ledger record.
**Content:**
- Header: "[Your name] record with [Their name]"
- Net balance prominent
- Transaction list with dates, notes
- Settlement history
- Disclaimer: personal record

**CTAs:**
- "Pay ₹X via UPI" — deep-link, pre-filled
- UPI QR code — scannable
- "Share on WhatsApp" — text + link
- "Something looks wrong?" — notify owner

### 6.8 UPI Deep-Link + QR Spec

```
upi://pay?pa=[UPI_ID]&pn=[NAME]&am=[AMOUNT]&cu=INR&tn=[NOTE]
```
- **Android:** Deep-link to PhonePe/GPay/Paytm
- **iOS:** QR code (primary) + deep-link
- **Desktop:** Copy UPI ID + QR code

QR code: client-side `qrcode.react`.

---

## 7. Differentiators

| # | Differentiator | Why it matters |
|---|----------------|----------------|
| 1 | **Zero-friction friend** | Friend no install. WhatsApp link → UPI pay. |
| 2 | **3-tap log** | Faster than messaging. |
| 3 | **Cultural native** | UPI-first, cash equal, Hindi-friendly, WhatsApp channel. |
| 4 | **No paywall** | Yaari Khaatha is free. |
| 5 | **Soft collection** | Share clean link vs awkward text. |

---

## 8. Closed Decisions Log

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | App name | Yaari Khaatha |
| 2 | Home screen | Split display |
| 3 | Offline | Read-only cache. Sync V1.1 |
| 4 | V1 categories | None. Free-text note only |
| 5 | Visual | Mocha Premium (cream/mocha, light/dark) |
| 6 | Backend | Supabase + Vercel |
| 7 | Payment | UPI deep-link + QR only |
| 8 | Platform | PWA only |
| 9 | Auth | Email/pass + Google OAuth + email OTP |
| 10 | Language | TypeScript (relaxed) |
| 11 | State | TanStack Query + Zustand |
| 12 | Nav | 4 tabs + FAB |
| 13 | Group split | Equal only V1 |
| 14 | Monetization | None. "Buy coffee" option |
| 15 | Styling | Tailwind CSS v4 |
| 16 | Data model | One-sided + linked_user_id for V3 |
| 17 | Share expiry | No expiry, live |
| 18 | Share domain | Vercel subdomain |

---

## 9. Visual Design Tokens — Mocha Premium

### Color Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F3EDE6` | Warm cream |
| `--card` | `#FEFCF9` | Warm white cards |
| `--hero` | `#1A1613` | Hero card (near-black) |
| `--accent` | `#C4470A` | Burnt orange — CTA + negative |
| `--positive` | `#167A33` | Forest green — they owe me |
| `--text-primary` | `#1A1613` | Body |
| `--text-secondary` | `#6D5F51` | Labels |
| `--text-tertiary` | `#A49484` | Timestamps |
| `--border` | `#DDD5CA` | Borders |
| `--divider` | `#EBE4DB` | Dividers |
| `--error` | `#B91C1C` | Errors |
| `--success` | `#167A33` | Settlement confirm |
| `--avatar-bg` | `#2C241C` | Avatar |

### Color Palette (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#12100D` | Dark mocha |
| `--card` | `#1D1915` | Dark cards |
| `--hero` | `#FEFCF9` | Hero card (inverted) |
| `--accent` | `#E05A1A` | Bright orange |
| `--positive` | `#3BD870` | Bright green |
| `--text-primary` | `#EDE8E0` | Body |
| `--text-secondary` | `#968778` | Labels |
| `--text-tertiary` | `#584E44` | Hints |
| `--border` | `#2A241E` | Borders |
| `--divider` | `#201C18` | Dividers |
| `--error` | `#EF4444` | Error |
| `--success` | `#3BD870` | Success |
| `--avatar-bg` | `#2C241C` | Avatar |

### Typography

| Usage | Size | Weight | Letter spacing |
|-------|------|--------|----------------|
| Hero balance amount | 32px | 600 | -1px |
| Section heading | 12px | 500 | +0.08em, uppercase |
| Person name | 16px | 500 | -0.1px |
| Balance amount (list) | 15px | 600 | -0.3px |
| Note/subtitle | 13px | 400 | 0 |
| Timestamp / hint | 12px | 400 | 0 |
| CTA button | 15px | 600 | +0.01em |

**Min size: 12px. Primary interactive: 16px.**

### Shadows, Radius
```css
--shadow-card: 0 2px 8px rgba(26, 22, 19, 0.07), 0 1px 2px rgba(26, 22, 19, 0.04);
--shadow-cta:  0 4px 14px rgba(196, 71, 10, 0.35);
--radius-card: 14px;
--radius-hero: 16px;
--radius-cta:  13px;
--radius-avatar: 50%;
--radius-chip: 8px;
```

### Design Principles
1. **Mocha Premium** — warm cream/mocha tones.
2. **Accent shadow** — orange button casts orange glow.
3. **Tight letter-spacing on numbers** — money reads confident.
4. **Dark inverted hero card** — high contrast.
5. **Warm shadows** — `rgba(26,22,19,...)` not black.
6. **Card-on-bg layering** — depth.

---

## 10. Out of Scope — V1

| Feature | Reason |
|---------|--------|
| Processing payments | Aggregator license needed |
| Custom splits | V1.1 |
| Natural language parse | V2 |
| Mutual ledger | V3 |
| Spending analytics | Phase 2 |
| Push notifications | V2 |
| Statement import | License needed |
| App Store listing | PWA first |
| Offline sync engine | V1.1 |
| Monetization | Post-traction |

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Log speed | <3 taps / 10 seconds |
| Page load | <2 seconds on mid-range Android |
| Offline | Read-only cached |
| Accuracy | Paise integer only |
| Privacy | No selling, deletable |
| Multi-user | Supabase schema support from day 0 |
| Dark mode | Toggle |
| Min height | 64px touch target |

---

## 12. Success Metrics — V1

| Metric | Target 30 days |
|--------|----------------|
| D7 retention | >40% |
| D14 retention | >25% |
| Txs per week | >5 |
| Share summaries | >1/month |
| Session length | <60 seconds |
