# 03 — Companion Public Profile

> `FE` 🟡 UI only (mock data) · `BE` 🔲 Not started

---

## Who can see it
Anyone — logged in or not. URL: `/companions/:id`

---

## What it shows

| Section | Details |
|---------|---------|
| Header | Photo, name, age, city, neighbourhood, verified badge, online status |
| Bio | Short paragraph written by the companion |
| Services | List of experience types they offer |
| Rate | Hourly rate (₹/hr) |
| Availability | Days of week + general hours (e.g. Mon–Sat, 9 AM – 9 PM) |
| Rating | Star average + total review count |
| Reviews | Latest 5 reviews with star rating, written comment, and user first name |
| Book button | Sticky bottom bar on mobile, inline on desktop |

---

## Book Now button

- If visitor is **not logged in**: tapping Book Now shows a prompt to log in or register, then returns them to this profile
- If visitor **is logged in**: goes to `/app/bookings/new/:companionId`
- If companion's profile is **inactive or unverified**: button hidden, show "Not available for bookings right now"

---

## Reviews on profile

- Sorted by most recent first
- Show reviewer's first name only (no surname)
- Show date of review
- No pagination in v1 — show latest 10
