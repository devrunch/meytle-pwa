# 09 — Companion Dashboard

> `FE` 🟡 UI exists, hardcoded stats · `BE` 🔲 Not started

At `/app/companion/dashboard`. Only visible to users with companion role.

---

## Stats strip (top of page)

| Stat | How calculated |
|------|---------------|
| Earnings this month | Sum of completed booking totals minus platform fee, current calendar month |
| Total bookings | Count of all bookings (any status) |
| Rating | Average star rating across all reviews |
| Response rate | % of pending requests responded to (accepted or declined) within 24 hours |

---

## Pending requests

- Shows all bookings with status `pending` for this companion
- Mobile: swipeable card stack (swipe right = accept, swipe left = decline)
- Desktop: list with Accept / Decline buttons
- Each card shows: user name, service, date, time, meeting spot, amount they'd earn
- Auto-expires after 24 hours — user refunded, request disappears from list

---

## Upcoming bookings

- Shows all bookings with status `confirmed`, sorted by soonest first
- Each row: user name, service, date/time, meeting spot, total
- Tapping opens the booking detail

---

## Earnings chart

- Bar chart of daily earnings over the past 7 days
- Y-axis: ₹ amount
- X-axis: day labels (Mon, Tue, …)
- In v1 this is a simple SVG bar chart — no third-party chart library needed

---

## Quick actions

- Toggle availability (go online / offline) — immediately updates `isAvailableNow` on their profile
- Link to edit profile
- Link to view their public profile
