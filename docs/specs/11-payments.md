# 11 — Payments

> `FE` 🟡 UI shows card placeholder · `BE` 🔲 Not started
> **Gateway: Stripe** ✅ Confirmed

---

## Stack

| Component | Tool |
|-----------|------|
| Card payments | Stripe Payments (Stripe.js + Payment Intents) |
| Companion payouts | Stripe Connect (Express accounts — easiest onboarding) |
| Identity verification | Stripe Identity (during companion onboarding) |
| Webhooks | Stripe → our backend for async payment events |

---

## Platform fee

- **Direction: deducted from companion payout** ✅ Confirmed
- User always pays the listed price — no surprise fees at checkout
- Fee % stored in `PLATFORM_FEE_PERCENT` env var (default `5`)
- Can be updated via admin config without a redeploy
- Applied at capture time, not at authorisation

```
Env var:  PLATFORM_FEE_PERCENT=5
Admin UI: Settings → Platform Fee (changes DB config record, env is the fallback)
```

---

## Companion payout setup — keep it simple

Using **Stripe Connect Express accounts** — this is the easiest path for companions:

1. During onboarding Step 7, companion taps "Set up payouts"
2. Stripe Connect onboarding opens (handled entirely by Stripe — we never touch bank details)
3. Companion enters:
   - Name, date of birth
   - Indian bank account number + IFSC (Stripe supports this for India)
4. Stripe verifies and creates the connected account
5. We store the `stripeAccountId` on the companion record — that's all we need
6. Payouts happen automatically when we transfer funds to their `stripeAccountId`

**What we do NOT store:** card numbers, bank account numbers, IFSC codes — Stripe holds all of it.

---

## Payment flow

```
User confirms booking
        │
        ▼
Stripe Payment Intent created (authorise, do not capture)
        │
        ▼
Booking status → pending · Companion notified
        │
   Companion accepts
        │
        ▼
Booking status → confirmed · Payment Intent remains authorised
        │
   Session happens
        │
   Companion taps "Mark as Completed"
        │
        ▼
Backend captures Payment Intent
Backend calculates: amount - (amount × PLATFORM_FEE_PERCENT / 100)
Stripe Transfer to companion's stripeAccountId
        │
        ▼
Booking status → completed · User can leave review
```

---

## Cancellation policy ✅ Confirmed

| Scenario | Refund to user |
|----------|----------------|
| Companion declines request | 100% — Payment Intent cancelled (never captured) |
| Request auto-expires after 24h | 100% — Payment Intent cancelled |
| User cancels **more than 3h before** start | 50% — partial refund via Stripe Refund API |
| User cancels **less than 3h before** start | 0% — no refund |
| User no-show | 0% — no refund |
| Companion cancels after confirming | 100% to user + companion flagged (repeat cancellations → review) |

**3-hour window is calculated server-side** using the booking's `startTime` in UTC. The frontend shows the cancellation button and its consequence but the backend enforces the policy — the client timestamp is not trusted.

---

## Custom request tip

- Charged separately as a second Payment Intent at request submission time
- If companion declines: tip refunded in full
- If companion accepts: tip transferred to companion immediately (not held), not subject to platform fee
- Minimum tip: ₹100

---

## Stripe webhooks to handle

| Event | Action |
|-------|--------|
| `payment_intent.payment_failed` | Mark booking failed, notify user |
| `payment_intent.canceled` | Confirm refund processed |
| `transfer.created` | Log payout to companion record |
| `account.updated` (Connect) | Update companion's verification status |
| `identity.verification_session.verified` | Approve companion profile |
| `identity.verification_session.requires_input` | Flag companion — re-verification needed |

---

## Environment variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
PLATFORM_FEE_PERCENT=5
```
