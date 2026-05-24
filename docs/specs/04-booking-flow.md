# 04 — Booking Flow

> `FE` 🟡 UI complete, no API calls · `BE` 🔲 Not started
> **Custom requests: in scope for v1** ✅ Confirmed

4-step wizard at `/app/bookings/new/:companionId`

---

## Step 1 — Choose Service

- User picks one service from the companion's listed services
- All services billed at the same hourly rate in v1
- Cannot proceed without a service selected

---

## Step 2 — Pick Date & Time

### Regular day (within companion's schedule)

- Calendar highlights the companion's available days
- User selects a date → sees available hourly start slots
- User selects a start time
- User selects duration: 1, 2, 3, or 4 hours
- Cannot proceed without date + start time + duration

### Custom request (outside companion's schedule) ✅ In scope for v1

- User selects a day that is outside the companion's regular schedule (greyed out on calendar)
- User must provide:
  - Start time and end time (free-form from the time picker)
  - A tip for the companion — **minimum ₹100, required** — to incentivise them to accommodate
  - Optional note to the companion explaining the request
- The companion can accept or decline custom requests the same as regular ones
- If accepted: session proceeds at the companion's standard hourly rate
- Tip is charged immediately at request submission (separate charge, see `11-payments`)

---

## Step 3 — Meeting Spot

- Map centred on NCR, showing the companion's service area as a shaded radius circle
- User taps the map to drop a pin, or types a place name / address in the search bar
- If pin is placed **outside** the companion's radius:
  - Soft warning shown: "This is outside their usual area — they may decline"
  - User can still proceed
- Cannot proceed without a meeting location (pin or text)

---

## Step 4 — Confirm & Pay

**Booking summary shows:**
- Companion photo, name, rating
- Service, date, time, duration, meeting spot
- Price breakdown (see below)
- Stripe card input (Stripe.js Element — card number never touches our server)
- Disclaimer: "By confirming you agree to our booking terms and cancellation policy"

**Price breakdown — regular booking:**
```
Service rate:     ₹800 × 2 hrs = ₹1,600
Platform fee:     deducted at payout (not shown to user)
─────────────────────────────────────────
You pay now:      ₹1,600
Companion earns:  ₹1,520 (after 5% fee)
```

**Price breakdown — custom request:**
```
Tip (charged now):        ₹200
Session price:            Agreed at confirmation
Platform fee on session:  Deducted at payout
```

**On "Confirm Booking":**
1. Backend creates a Stripe Payment Intent (authorise, do not capture)
2. Booking record created with status `pending`
3. Companion receives a push notification
4. User redirected to `/app/bookings/:id` (booking detail)

**Cannot confirm if:**
- No card entered or card declined
- Any previous step is incomplete

---

## Booking statuses

| Status | Meaning | Who can change it |
|--------|---------|------------------|
| `pending` | Submitted, waiting for companion | Companion (accept/decline), system (auto-expire 24h) |
| `confirmed` | Companion accepted, payment held | User (cancel), companion (cancel, mark complete) |
| `completed` | Session done, payment released | System only |
| `cancelled` | Cancelled by either party or auto-expired | — |

---

## Cancellation rules (from `11-payments`) ✅ Confirmed

| Who cancels | When | User refund |
|-------------|------|-------------|
| Companion declines | Any time before confirm | 100% |
| Auto-expire (24h no response) | — | 100% |
| User | > 3h before start | 50% |
| User | ≤ 3h before start | 0% |
| Companion | After confirming | 100% to user |
