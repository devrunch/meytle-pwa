# 13 — Session Flow (OTP Start + Auto-Complete + No-Show)

> `FE` 🔲 Not started · `BE` 🔲 Not started
> **Confirmed decisions recorded here**

This is the most important trust flow on the platform.
It covers what happens from the moment a confirmed booking's start time approaches
until the session ends and payment is released.

---

## Revised booking status model

```
pending
  │  Companion accepts
  ▼
confirmed
  │  OTP verified by companion (at start)
  ▼
in_progress  ◄─── actual start time logged here
  │  Auto-completes after booked duration
  │  OR companion taps "End Session" early
  ▼
completed ───► payment captured, review unlocked
  
(at any point before in_progress, can move to cancelled via admin)
```

| Status | Meaning |
|--------|---------|
| `pending` | User submitted, waiting for companion to accept |
| `confirmed` | Companion accepted, payment authorised, OTP not yet used |
| `in_progress` | OTP verified, session is live, timer running |
| `completed` | Session ended (auto or manual), payment released |
| `cancelled` | Admin-initiated — either before or after confirmation |

---

## OTP generation

- Generated **server-side** when booking moves to `confirmed`
- **One OTP per booking** — never regenerated, never expires until used
- Revealed to the user only **within 15 minutes of the booking start time**
- Before that window: user sees "Your OTP will appear 15 minutes before your session"

**OTP format:**
- 6-digit numeric code (e.g. `482 913`)
- Also available as a **QR code** (encodes the same value) — companion can scan instead of typing

**Where it appears:**
- User: booking detail page (`/app/bookings/:id`) — large, prominent display once window opens
- Companion: enters in their booking detail page (`/app/companion/bookings/:id`)

---

## Session start — OTP verification

```
User arrives at meeting point
User opens booking → shows OTP or QR to companion
Companion opens their booking → enters OTP or scans QR
          │
          ▼
Server verifies OTP matches booking
          │
          ▼
booking.status       → in_progress
booking.actualStart  → current server timestamp (UTC)
OTP invalidated      → cannot be used again
          │
          ▼
Both parties see session timer in their app
```

**If OTP entry is wrong:** Should not happen — it is generated once and shown directly to the user. No retry limit needed, but log any mismatch attempts for fraud detection.

---

## Session end — auto-complete (Option C)

```
booking.actualStart + booking.bookedDuration
          │
          ▼
System marks booking → completed
booking.actualEnd → calculated timestamp
Payment captured  → platform fee deducted → payout to companion
User unlocked     → can leave review
```

**Companion can also end early (Option A):**
- "End Session" button visible during `in_progress`
- Companion taps it → booking → `completed` immediately
- `actualEnd` logged at that moment
- Payment is still based on **booked duration** — not actual duration
  - We do not charge more or less based on actual time
  - This is for records and analytics only

**Auto-complete safety net:**
- If session is `in_progress` and `actualStart + bookedDuration + 2h grace` passes with no action:
  - System auto-completes
  - Logs as `autoCompleted: true`

> **v2 analytics:** Flag companions who repeatedly end sessions significantly earlier than booked duration — useful signal for quality monitoring. Out of scope for v1.

---

## No-show handling

### What "no-show" means
Either party is not at the meeting point within **30 minutes of the booking start time**.

### Meeting point tracking
- The meeting spot coordinates are saved at booking step 3
- Both the user's app and companion's app passively report location during the 15-min OTP window and for 30 mins after start time
- Location is only tracked during this window — not continuously
- Used exclusively for no-show resolution — not shown to either party in real time

### Flow when user does not appear

```
Companion arrives at meeting point
User does not appear within 30 minutes of start time
          │
Companion taps "User didn't show up" in their app
          │
          ▼
Admin / customer support is notified
Admin sees:
  - Companion's last known location
  - User's last known location
  - Meeting point coordinates
  - Time elapsed since start
Admin contacts user via in-app message or phone
          │
    Admin decides outcome
          │
          ▼
Admin uses payout split tool (see below)
```

### Admin payout split tool

When admin handles a no-show or dispute, they set three values that must add up to 100%:

| Field | Description | Example |
|-------|-------------|---------|
| Companion % | What the companion receives from the held payment | 50% |
| User refund % | What is refunded to the user's card | 40% |
| Platform % | What Meytle keeps | 10% |

- Admin enters these in the admin panel on the booking record
- System executes: Stripe partial capture + partial refund + transfer to companion
- Both parties notified of the outcome with the admin's decision

**Default suggestion pre-filled for admin (editable):**

| Scenario | Companion | User refund | Platform |
|----------|-----------|-------------|----------|
| User no-show, companion verified at location | 50% | 40% | 10% |
| Companion no-show, user verified at location | 0% | 100% | 0% |
| Both no-show / unclear | 0% | 90% | 10% |

These are suggestions only — admin overrides every time.

---

## Location tracking — technical rules

- App requests location permission at booking confirmation (not at install)
- Tracking is **only active** during:
  - 15 mins before start → 30 mins after start (pre-session window)
  - Stops once OTP is verified (session is live, no longer needed)
- Location data is stored temporarily (max 48h) then deleted
- Used only for no-show resolution, never shared with either party
- Shown only to admin during a dispute

---

## Summary of data logged per session

| Field | Set when | Used for |
|-------|----------|---------|
| `bookedStart` | Booking created | Schedule, OTP window |
| `bookedEnd` | Booking created | Auto-complete trigger |
| `bookedDuration` | Booking created | Payment basis |
| `actualStart` | OTP verified | Records, analytics |
| `actualEnd` | Companion ends / auto-complete | Records, analytics |
| `otpVerifiedAt` | OTP matched | Audit log |
| `autoCompleted` | System ends session | Audit log |
| `companionLocation` | Pre-session window | No-show resolution |
| `userLocation` | Pre-session window | No-show resolution |
