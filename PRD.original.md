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
| 0.2 | Working title → Settlo. All 5 open decisions closed. Visual design tokens added. Backend confirmed as Supabase. Categories removed from V1. |
| 0.3 | Settlo → Yaari Khaatha. 14 grill decisions locked: TypeScript, TanStack Query + Zustand, Tailwind v4, Mocha Premium palette (light+dark), revised typography, 4-tab + FAB nav, email/password + Google OAuth, one-sided model + linked_user_id, equal splits only, read-only offline, UPI QR on share page. |

---

## 1. Problem Statement

Indian college students engage in daily informal financial transactions — covering food, auto rides, group orders, and shared expenses — with friends. There is no lightweight, culturally appropriate tool to track these. The result is forgotten debts, social friction when asking for money back, and zero visibility into where money actually goes.

Existing tools fail because:
- **Splitwise** is built for structured adult expenses, is paywalled past 3–4 entries/day, requires all parties to install the app, and has no UPI integration.
- **Khatabook / OkCredit** target shopkeepers tracking customer credit — wrong social context.
- **Mental tracking / notebooks** have no structure, no reminders, and high forgetting rate.
- **WhatsApp** creates awkwardness when following up on money.

No product exists that is built specifically for the Indian student peer-debt context: cash and UPI treated equally, solo use without forcing friends to sign up, sub-3-tap logging for ₹20–500 daily transactions, and a tone that matches how friends actually talk about money.

---

## 2. Goal

Build a frictionless financial memory system for Indian college students, starting with informal give-take transaction tracking, which naturally generates the data infrastructure for personal finance intelligence and behavioural awareness — ultimately evolving into a comprehensive financial operating system.

**The entry point is the give-take ledger. Everything else is downstream of that data.**

---

## 3. Target User

**Primary:** Indian college students, 18–23, Tier 1–3 cities
**Secondary:** Young working professionals, 22–28, first job

**User profile:**
- Income: Pocket money (₹3,000–15,000/month) + occasional freelance or tuition gigs — irregular and lumpy
- Payment behaviour: UPI-native (PhonePe, GPay), also handles significant cash — both treated identically
- Social context: Tight friend groups, daily shared expenses, strong aversion to formal "invoice" dynamics
- Pain point: Cannot tell you the exact net amount they are owed right now
- Status quo: Mental tracking, forgetting, absorbing small losses, occasional awkward WhatsApp message

**Who is NOT the target user (v1):**
- Shop owners tracking customer credit (that is Khatabook)
- Adults splitting rent or utilities (that is Splitwise)
- People who settle every transaction immediately (they have already solved the problem for themselves)

---

## 4. Core Insight

The merchant **khata** (ledger) model is culturally proven and deeply understood in India. Khatabook built a ₹4,500 crore company applying it to shopkeeper-customer credit. **Nobody has built the social equivalent for student peer-to-peer transactions.** That is the gap.

---

## 5. Product Vision — Phased Roadmap

### Phase 1 — Financial Memory (v1, current focus)
**Goal:** Be the most reliable record of who owes what.
**Core question answered:** "What is my net position with each person right now?"

### Phase 2 — Financial Visibility
**Goal:** Surface patterns in how money moves.
**Core question answered:** "Where does my money actually go each month?"

### Phase 3 — Financial Control
**Goal:** Give users tools to act on what they see.
**Core question answered:** "How do I spend less on things I regret?"

### Phase 4 — Financial Awareness
**Goal:** Connect emotional state to spending patterns.
**Core question answered:** "Why do I spend the way I do?"

---

## 6. V1 Scope — Phase 1 Only

### 6.1 Core Objects

| Object | Description |
|--------|-------------|
| **Person** | Someone you transact with. Name, optional UPI ID, optional phone. Does NOT need to be an app user. |
| **Transaction** | A financial event. Amount, who paid, who was involved, note, date. No category in V1. |
| **Settlement** | A repayment event. Reduces the running balance. Full or partial. |
| **Group** | Optional named collection of people for recurring group expenses. Equal splits only in V1. |

### 6.2 Core Flows — V1

**Flow 1: Log a direct IOU**
> "I paid ₹200 for Priya's auto."
→ Add person (if new) → Enter amount + note → Confirm who owes whom → Done. Under 3 taps.

**Flow 2: Log a group split (equal only)**
> "I paid ₹480 for group Domino's, 4 people, equal split."
→ Select or create group → Enter total + who paid → Equal split auto-calculated → Confirm → Done.

**Flow 3: Log a settlement**
> "Rahul paid me back ₹300 of the ₹480 he owes."
→ Open Rahul's ledger → Tap "Settle" → Enter amount → Mark as cash or UPI → Balance updates.

**Flow 4: View per-person ledger**
> Full transaction history with Rahul. Running balance. Settlement history. Share button.

**Flow 5: Generate shareable summary**
> Read-only link. No login required for recipient. Shows balance, itemised transactions, UPI deep-link, QR code to pay, "Something looks wrong?" button.

### 6.3 Input Model

Hybrid — text input with quick-action chips:

```
[ paid ₹___ for ___ ]
  [Food] [Auto] [Chai] [Other]
  [Split equally] [I paid] [They paid]
```

Note field is optional free-text. Speed of logging is the primary constraint — chips are helpers, never required.

Natural language parsing (e.g. "Rahul owes me 200 for lunch") is a V2 feature.
Custom splits (per-person amounts) are a V1.1 feature.

### 6.4 Home Screen — Primary Information Architecture

**Decided: Split display.**

Top, large: **"People owe you ₹X"** — positive framing, primary recovery driver
Below, smaller: **"You owe ₹Y"** — secondary, creates action
Net balance: one tap deeper, not on home screen
Unsettled count: surface only as a supporting detail

Rationale: Net balance hides information. If Rahul owes you ₹500 and you owe Priya ₹480, net shows ₹20 — meaningless. Seeing both numbers separately creates the right tension and drives the right actions from both directions.

### 6.5 Authentication

**Flows:**
1. **Email + password** — classic sign-up/login. Email OTP for verification (not SMS — avoids Supabase costs).
2. **Google OAuth** — one-tap alternative. Open to all Google accounts (no domain restriction).
3. **Optional phone number** — captured in onboarding for UPI/WhatsApp context. Not used for auth.

### 6.6 Navigation

Bottom nav — 4 tabs + FAB center. Mobile-first responsive.

```
[ 🏠 Home ]  [ 👥 Groups ]  [ ➕ FAB ]  [ 📋 Activity ]  [ ⚙️ Settings ]
```

- **Home** — hero card + person list (your khata)
- **Groups** — manage groups, group splits
- **+ FAB** — log transaction (primary action, raised center button)
- **Activity** — recent transactions timeline across all persons
- **Settings** — profile, UPI ID, dark mode toggle, buy developer a coffee

Person detail = drill-down from Home (tap on person card).

### 6.7 Shareable Summary — Design Spec

This is the key differentiator. Treated as a high-end feature from day one.

**URL format:** `[VITE_APP_URL]/s/[nanoid-token]` — shareable, no login to view
**Expiry:** None. Always fetches live/current data.
**Tone:** "Here is what I have recorded" — neutral, not accusatory
**Content:**
- Header: "[Your name]'s record with [Their name]"
- Net balance prominently displayed
- Itemised transaction list with dates and notes
- Settlement history
- Disclaimer: "This is [name]'s personal record"

**CTAs:**
- "Pay ₹X via UPI" — deep-link, pre-filled amount + UPI ID
- UPI QR code — scannable, same deep-link data
- "Share on WhatsApp" — pre-written message with link
- "Something looks wrong?" — sends notification to ledger owner

### 6.8 UPI Deep-Link + QR Spec

```
upi://pay?pa=[UPI_ID]&pn=[NAME]&am=[AMOUNT]&cu=INR&tn=[NOTE]
```

- **Mobile (Android):** Direct deep-link opens PhonePe/GPay/Paytm pre-filled
- **Mobile (iOS):** QR code (primary) + deep-link attempt
- **Desktop:** UPI ID copy button + QR code

QR code generated client-side using `qrcode.react` from same UPI deep-link string.

---

## 7. Differentiators

| # | Differentiator | Why it matters |
|---|----------------|----------------|
| 1 | **Zero-friction for friend** | Friend doesn't install anything. Opens WhatsApp link, sees ledger, taps UPI pay. |
| 2 | **3-tap logging** | Faster than opening WhatsApp to ask "bhai, kitna hua?" |
| 3 | **Culturally native** | UPI-first, cash equal, Hindi-friendly tone, WhatsApp share channel |
| 4 | **No paywall** | Splitwise limits free users. Yaari Khaatha is free. |
| 5 | **Soft collection** | Sharing a clean link is socially graceful vs. "bhai, mere ₹500 de de" |

---

## 8. Closed Decisions Log

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | App name | Yaari Khaatha — working title |
| 2 | Home screen | Split display — "People owe you ₹X" large + "You owe ₹Y" smaller |
| 3 | Offline strategy | Read-only offline (TanStack Query cache). Full sync = V1.1 |
| 4 | V1 categories | None — optional free-text note only |
| 5 | Visual design | Mocha Premium — warm cream/mocha, light+dark mode |
| 6 | Backend | Supabase + Vercel |
| 7 | Payment integration | UPI deep-link + QR code only |
| 8 | Platform | PWA only — no app store |
| 9 | Auth | Email/password + Google OAuth + email OTP |
| 10 | Language | Pure TypeScript, relaxed config |
| 11 | State | TanStack Query v5 + Zustand |
| 12 | Navigation | 4 tabs + FAB center |
| 13 | Group splits | Equal only V1 |
| 14 | Monetization | None. "Buy coffee" in Settings |
| 15 | Styling | Tailwind CSS v4 |
| 16 | Data model | One-sided + linked_user_id for V3 |
| 17 | Share expiry | No expiry, live data |
| 18 | Share domain | Vercel subdomain, buy domain later |

---

## 9. Visual Design Tokens — Mocha Premium

### Color Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F3EDE6` | Warm cream background |
| `--card` | `#FEFCF9` | Warm white cards |
| `--hero` | `#1A1613` | Hero balance card — warm near-black |
| `--accent` | `#C4470A` | Deep burnt orange — CTA + negative amounts |
| `--positive` | `#167A33` | Forest green — "they owe me" amounts |
| `--text-primary` | `#1A1613` | Body text |
| `--text-secondary` | `#6D5F51` | Labels |
| `--text-tertiary` | `#A49484` | Timestamps, hints |
| `--border` | `#DDD5CA` | Card borders |
| `--divider` | `#EBE4DB` | Row dividers |
| `--error` | `#B91C1C` | Form errors |
| `--success` | `#167A33` | Settlement confirmed |
| `--avatar-bg` | `#2C241C` | Avatar circle |

### Color Palette (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#12100D` | Dark mocha background |
| `--card` | `#1D1915` | Dark cards |
| `--hero` | `#FEFCF9` | Hero card (inverts in dark) |
| `--accent` | `#E05A1A` | Brighter orange for dark bg |
| `--positive` | `#3BD870` | Brighter green for dark bg |
| `--text-primary` | `#EDE8E0` | Light body text |
| `--text-secondary` | `#968778` | Muted labels |
| `--text-tertiary` | `#584E44` | Hints |
| `--border` | `#2A241E` | Dark borders |
| `--divider` | `#201C18` | Dark dividers |
| `--error` | `#EF4444` | Bright error |
| `--success` | `#3BD870` | Bright success |
| `--avatar-bg` | `#2C241C` | Same across modes |

### Typography
**Font:** DM Sans — geometric, clean, warm.

| Usage | Size | Weight | Letter spacing |
|-------|------|--------|----------------|
| Hero balance amount | 32px | 600 | -1px |
| Section heading | 12px | 500 | +0.08em, uppercase |
| Person name | 16px | 500 | -0.1px |
| Balance amount (list) | 15px | 600 | -0.3px |
| Note/subtitle | 13px | 400 | 0 |
| Timestamp / hint | 12px | 400 | 0 |
| CTA button | 15px | 600 | +0.01em |

**Minimum text size: 12px. Primary interactive text: 16px.**

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
1. **Mocha Premium** — warm cream/mocha tones, not generic fintech blue
2. **Accent-coloured CTA shadow** — orange button casts orange glow
3. **Tight negative letter-spacing on numbers** — money reads confident
4. **Dark inverted hero card** — max contrast for most important number
5. **Warm-toned shadows** — `rgba(26,22,19,...)` not `rgba(0,0,0,...)`
6. **Card-on-warm-bg layering** — depth without decoration

---

## 10. Out of Scope — V1

| Feature | Reason |
|---------|--------|
| Processing actual UPI payments | Requires RBI-licensed payment aggregator |
| Custom splits | V1.1 |
| Natural language input parsing | V2 |
| Mutual ledger (both parties add entries) | V3 |
| Spending pattern analytics / categories | Phase 2 |
| Push notifications | V2 |
| Bank account / UPI statement import | Requires aggregator license |
| iOS App Store / Google Play listing | PWA first |
| Full offline sync engine | V1.1 |
| Monetization architecture | Post-traction |

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Transaction log speed | Under 3 taps / 10 seconds for a simple IOU |
| Page load (PWA, mobile) | Under 2 seconds on mid-range Android |
| Offline support | Read-only cached data when offline |
| Data accuracy | Balance calculations deterministic — integer arithmetic (paise) only |
| Privacy | No financial data sold or shared. All user data deletable. |
| Multi-user architecture | Backend schema supports multiple users from day 0 |
| Dark mode | Full light/dark mode with user toggle |
| Card min height | 64px for touch targets |

---

## 12. Success Metrics — V1

| Metric | Target at 30 days |
|--------|-------------------|
| D7 retention | >40% |
| D14 retention | >25% — the metric that matters most |
| Transactions logged per active user per week | >5 |
| Shareable summaries generated | >1 per active user per month |
| Average session length | <60 seconds |
