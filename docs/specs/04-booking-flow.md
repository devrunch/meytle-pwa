# 04 — Booking Flow

> `FE` 🟡 UI complete, no API calls · `BE` 🔲 Not started

4-step wizard at `/app/bookings/new/:companionId`

---

## Step 1 — Choose Service

- User picks one service from the companion's offered list
- All services billed at the same hourly rate in v1
- Cannot proceed without selecting a service

---

## Step 2 — Pick Date & Time

### Available day (companion's regular schedule)
- Calendar shows companion's available days highlighted
- User picks a start time from available slots
- User picks duration: 1, 2, 3, or 4 hours
- Cannot proceed without both a time slot and duration selected

### Unavailable day (custom request)
- User picks any day outside the companion's regular schedule
- User must provide:
  - Start time and end time
  - A tip (minimum ₹100) to incentivise the companion — required field
  - Optional note to the companion
- The companion may accept or decline custom requests
- ⚠️ Whether custom requests are in scope for v1 — see Q8 in `00-overview`

---

## Step 3 — Meeting Spot

- User taps the map to drop a pin within the companion's service area
- Alternatively, user types an address or place name
- A radius circle on the map shows the companion's service area
- If pin is outside the radius: show a soft warning ("Outside their usual area — companion may decline")
- Cannot proceed without a meeting location set

---

## Step 4 — Confirm & Pay

**Shows:**
- Companion summary (photo, name, rating)
- Chosen service, date, time, duration, meeting spot
- Price breakdown:
  - Hourly rate × hours
  - Platform fee (5%)
  - **Total charged now**
- For custom requests: tip amount charged upfront, session price agreed after confirmation
- Payment card input (Stripe or Razorpay — see Q1 in `00-overview`)
- "By confirming you agree to our booking terms and cancellation policy" disclaimer

**On confirm:**
- Booking created with status `pending`
- Payment authorised (held, not captured)
- Companion receives a notification
- User redirected to booking detail page

**Cannot confirm if:**
- No payment method entered
- Any required step is incomplete

---

## Booking statuses

| Status | Meaning |
|--------|---------|
| `pending` | Submitted by user, waiting for companion to accept |
| `confirmed` | Companion accepted, payment authorised |
| `completed` | Session done, payment released to companion |
| `cancelled` | Either party cancelled |
