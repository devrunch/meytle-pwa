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
| `confirmed` | Countdown to meeting time · Cancel button (if within cancellation window) · Message button |
| `completed` | "Leave a Review" button (if no review yet) |
| `cancelled` | Who cancelled · Refund status |

**Cancel rules:**
- Cancellation policy (hours and % refund) ⚠️ TBD — see Q3 in `00-overview`
- Cancel button is hidden once the cancellation window has passed

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
- Any note from the user (for custom requests)

**Rules:**
- Companion must respond within 24 hours or the request auto-expires and the user is refunded
- On accept → booking moves to `confirmed`, user notified, payment authorised
- On decline → booking moves to `cancelled`, user notified, full refund

---

## Companion — Booking Detail (`/app/companion/bookings/:id`)

Same layout as user's booking detail, from the companion's perspective.

**Conditional content by status:**

| Status | Extra UI |
|--------|----------|
| `pending` | Accept / Decline buttons |
| `confirmed` | Countdown to meeting time · Message button · "Mark as Completed" button |
| `completed` | Earnings shown, payout date if known |
| `cancelled` | Who cancelled |

**"Mark as Completed":**
- Only available after the booking's end time has passed
- Triggers payment release to companion (minus platform fee)
- Unlocks "Leave a Review" for the user
