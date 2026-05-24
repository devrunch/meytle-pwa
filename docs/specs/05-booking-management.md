# 05 — Booking Management

> `FE` 🟡 UI only (mock data) · `BE` 🔲 Not started

---

## User — My Bookings (`/app/bookings`)

Two tabs:
- **Upcoming** — bookings with status `pending` or `confirmed`
- **Past** — bookings with status `completed` or `cancelled`

Each card shows: companion photo, name, service, date/time, status badge, total paid.
Tapping a card opens the booking detail.

---

## User — Booking Detail (`/app/bookings/:id`)

**Always shows:** companion info, service, date/time, meeting spot, price breakdown, status.

**Conditional content by status:**

| Status | Extra UI |
|--------|----------|
| `pending` | "Waiting for companion to confirm" · Cancel button |
| `confirmed` | Countdown to meeting time · Message button (when within chat window) · OTP shown in last 15 mins · **No cancel button** |
| `in_progress` | Session live · Timer showing elapsed time · "End Session" button (companion only) |
| `completed` | "Leave a Review" button (if no review submitted yet) |
| `cancelled` | Who initiated the cancellation · Refund status |

---

## Cancellation rules ✅ Confirmed

### Before confirmation (status: `pending`)
- **User can cancel freely** — full refund, no questions asked
- Cancel button shown on booking detail while status is `pending`

### After confirmation (status: `confirmed`) ✅ Confirmed
- **Neither the user nor the companion can cancel through the app**
- No cancel button shown on confirmed bookings
- To cancel a confirmed booking, the user must contact **customer support**
- Support team handles the cancellation manually and applies refund policy:
  - More than 3h before start → 50% refund
  - Less than 3h before start → no refund
  - Companion-initiated → 100% refund to user

> **Why:** Prevents last-minute abuse and protects both parties once commitment is made.

---

## Companion — Incoming Requests

**Where:** Companion Dashboard (`/app/companion/dashboard`)

**Mobile:** Swipeable card stack (swipe right = accept, swipe left = decline)
**Desktop:** List view with Accept / Decline buttons

**Each request shows:**
- User first name
- Service requested
- Date, time, duration
- Meeting spot
- What the companion earns (total minus platform fee)
- Note from the user (for custom requests)

**Rules:**
- Companion must respond within **24 hours** or the request auto-expires
- On auto-expire: booking → `cancelled`, user gets a full refund, companion is notified
- On accept → booking → `confirmed`, payment authorised, user notified
- On decline → booking → `cancelled`, full refund to user, user notified

---

## Companion — Booking Detail (`/app/companion/bookings/:id`)

**Conditional content by status:**

| Status | Extra UI |
|--------|----------|
| `pending` | Accept / Decline buttons |
| `confirmed` | Countdown · Message button · OTP input (to verify user, starts session) |
| `in_progress` | Session live · Timer · "End Session" button |
| `completed` | Earnings amount · Payout date (if available) |
| `cancelled` | Who initiated · Whether refund was issued |

### "Mark as Completed" button
- Only shown after the booking's scheduled end time has passed
- Companion taps it to confirm the session happened
- Triggers Stripe payment capture → platform fee deducted → payout to companion
- Unlocks "Leave a Review" for the user
- If companion does not mark as completed within 24h of end time: **auto-completed by the system**
