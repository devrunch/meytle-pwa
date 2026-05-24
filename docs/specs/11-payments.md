# 11 — Payments

> `FE` 🟡 UI shows card placeholder · `BE` 🔲 Not started

---

## Gateway

⚠️ **Razorpay vs Stripe — see Q1 in `00-overview`.** Notes on both:

| | Razorpay | Stripe |
|--|---------|--------|
| India domestic cards | ✅ Better | 🟡 Works but more friction |
| UPI support | ✅ Yes | ❌ No |
| International cards | 🟡 Limited | ✅ Better |
| Payout to Indian bank | ✅ Native | 🟡 Stripe Connect needed |
| SDK quality | Good | Excellent |

**Recommendation:** Razorpay for v1 (India-first).

---

## Payment flow

1. User completes booking flow step 4 → hits "Confirm Booking"
2. Frontend collects card details via gateway SDK (card number never touches our server)
3. Backend creates a payment **authorisation** (hold) — money not yet captured
4. Booking status set to `pending`, companion notified
5. Companion accepts → booking moves to `confirmed`, payment remains authorised
6. Session happens
7. Companion taps "Mark as Completed" → booking moves to `completed`
8. Backend **captures** the payment, deducts 5% platform fee, initiates payout to companion

---

## Platform fee

⚠️ **Direction of fee — see Q2 in `00-overview`.**

| Option A | User pays ₹1,000 + ₹50 fee = ₹1,050 charged | Companion receives ₹1,000 |
| Option B | User pays ₹1,000 | Companion receives ₹950 (₹50 deducted) |

Until confirmed, assume **Option A** (fee on top, transparent to user).

---

## Refund rules

| Scenario | Refund |
|----------|--------|
| Companion declines | 100% refund, no fee charged |
| Request auto-expires (24h) | 100% refund |
| User cancels (within cancellation window) | ⚠️ TBD — see Q3 in `00-overview` |
| User cancels (outside window) | ⚠️ TBD |
| Companion cancels after confirming | 100% refund + ⚠️ penalty TBD |

---

## Custom request tip

- For off-schedule bookings, a tip (min ₹100) is charged upfront at request time
- If companion declines: tip refunded
- If companion accepts: tip paid directly to companion, not subject to platform fee
