# Design Specification — Settled Contacts Collapsible & UPI Setup Nudge

**Date:** June 09, 2026
**Author:** Antigravity (AI Assistant)
**Status:** Approved & Implemented

---

## 1. Feature Description

This design resolves two usability gaps identified in the Yaari Khaatha PWA interface:
1. **Dashboard Clutter:** Settled contacts (balance = 0) were taking up space on the main Home dashboard ledger.
2. **Missing UPI ID Error Prevention:** If the ledger owner shared a ledger summary without configuring their UPI ID in Settings, recipients would see a broken scan/payment button.

---

## 2. Settled Contacts Collapsible Section (Approach B)

### Behavior
- By default, the main "Friends Ledger" list on the Home screen only lists active contacts whose net balance is non-zero (either `owes_me` or `i_owe`).
- Settled contacts (balance === 0) are hidden under a collapsible divider at the bottom of the list.
- A toggle button labeled `Show settled friends (N) ▾` is displayed when collapsed. Clicking it changes the label to `Hide settled friends ▴` and expands the list of settled contacts below it in a neutral, slightly dimmed card design.

---

## 3. UPI Setup Nudge & Prevention Rules

### Share Page Handling
- **For Recipients (Guests):** If the ledger owner has not configured their UPI ID (`profiles.upi_id` is null or empty), all payment CTA buttons, scan QRs, and fallback warning text are hidden entirely. The guest simply views the read-only ledger details and timeline.
- **For Owner Preview:** If the owner accesses their own public link (verified by matching the active Supabase Auth user session ID with the token's `ownerId`), they see a dashed notice box reminding them: *"Add your UPI ID in Settings to enable payments."*

### Dashboard Nudge
- An integrated notification is rendered at the bottom of the summary `HeroCard` on the Home screen if:
  1. The user's profile has no `upi_id` set.
  2. The nudge has not been dismissed.
- The nudge displays the message: *"Add your UPI ID to let friends pay you directly →"* which links directly to the `/settings` route.
- A small dismiss `X` button allows dismissing the nudge. The dismissal state is tracked globally in the Zustand `useUIStore` and persists locally in `localStorage` under the key `yk-upi-nudge-dismissed`.

---

## 4. Verification Plan

### Manual Verification Steps
1. **Settled Toggle:** Log a full settlement for a contact to make their balance 0. Confirm they disappear from the active Home list and appear under the collapsed "Show settled friends (1)" toggle. Expand/collapse the section.
2. **UPI Missing Nudge:** Sign in with an account having no UPI ID configured. Confirm that the nudge banner appears inside the Ledger Summary HeroCard. Click the `X` button, refresh the page, and verify that the nudge remains dismissed.
3. **Share Preview:** Access the public shared link of an account with no UPI ID. If viewed in the same browser session (owner logged in), verify that the dashed placeholder is visible. If viewed in incognito (unauthenticated recipient), verify that the payment block is completely hidden.
