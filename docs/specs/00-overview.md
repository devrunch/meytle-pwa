# 00 — Product Overview

> Last updated: 2026-05-24

---

## What is Meytle?
A platform where people find and book a real companion to join them for experiences — coffee, dining, concerts, travel, fitness, and more. The companion is a verified individual, not a service business.

## The two sides

| Role | What they do |
|------|-------------|
| **User** | Browses companions, books a session, pays, and reviews |
| **Companion** | Lists themselves, sets availability, accepts bookings, earns money |

One account can be both. Becoming a companion is an optional onboarding flow done after registration.

---

## Confirmed decisions

| # | Decision | Detail |
|---|----------|--------|
| Q1 | **Payment gateway: Stripe** | Stripe Payments + Stripe Connect for companion payouts |
| Q2 | **Platform fee: 5% deducted from companion payout** | User always pays the stated price. Fee is configurable via `PLATFORM_FEE_PERCENT` env var or admin config — default 5% |
| Q3 | **Cancellation policy: 3 hours before = 50% refund** | Cancel more than 3h before start → 50% refund. Cancel less than 3h before or no-show → no refund. Companion cancels after confirming → 100% refund to user |
| Q4 | **Companion go-live: after identity verification** | Profile is live only after passing Stripe Identity (or Veriff as fallback). No manual admin review needed — automated. |
| Q5 | **v1 geography: India — NCR only** | Delhi, Gurgaon, Noida, Faridabad, Ghaziabad. Expand per city after v1. |
| Q6 | **Minimum age: 18** | Date of birth collected at onboarding. Stripe Identity confirms age via ID document. |
| Q7 | **Messaging: WebSockets** | Real-time via Socket.IO on NestJS. Fallback: long-polling if WS unavailable. |
| Q8 | **Custom booking requests: in scope for v1** | Off-schedule days allowed — companion must receive a tip (min ₹100) to incentivise. |

---

## How money works

- User pays the full session price at booking confirmation (no extra fee on top)
- Payment is **authorised and held** by Stripe — not captured until session is completed
- On completion: Stripe captures payment, platform deducts `PLATFORM_FEE_PERCENT` (default 5%), remainder paid out to companion via Stripe Connect
- `PLATFORM_FEE_PERCENT` is set in environment config and can be updated via admin panel without a deploy

**Example — ₹1,000 booking:**
```
User pays:          ₹1,000
Platform fee (5%):   -₹50
Companion receives:  ₹950
```

---

## Geography — v1

**India only. NCR region:**
- Delhi
- Gurgaon
- Noida
- Faridabad
- Ghaziabad

New cities added as separate deployments with their own companion pool.

---

## All questions resolved ✅

| # | Question | Decision |
|---|----------|----------|
| Q9 | Who sends the first message? | Either party — user can initiate within the 3h window |
| Q10 | Chat after confirmed booking is cancelled? | Thread becomes read-only; confirmed bookings can only be cancelled by support |
| Q11 | Phone numbers in chat? | Blocked server-side — pattern-filtered before delivery |
| Q12 | Veriff as Stripe Identity fallback? | Yes — and Veriff falls back to admin manual review (24h SLA) |

**No open questions remaining. Specs are ready to build against.**
