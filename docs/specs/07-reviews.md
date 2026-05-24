# 07 — Reviews

> `FE` 🔲 Not started · `BE` 🔲 Not started

---

## Who can leave a review
- Only the **user** (customer) can review a companion
- Companion cannot review the user in v1
- One review per booking — cannot be edited or deleted after submission

---

## When it becomes available
- "Leave a Review" button appears on the booking detail page after status is `completed`
- Disappears once a review has been submitted for that booking
- Review window: open for **14 days** after booking completion, then locked

---

## What a review contains
- **Star rating** — 1 to 5 stars (required)
- **Written comment** — optional, max 300 characters

---

## Where reviews appear
- On the companion's public profile (`/companions/:id`)
- Sorted by most recent first
- Shows: reviewer's first name, star rating, comment, date
- No surname shown — first name only

---

## How rating is calculated
- Companion's overall rating = average of all review star ratings
- Rounded to one decimal place (e.g. 4.7)
- Shown on companion card in the feed and on their profile
- Minimum 3 reviews before a rating is shown publicly; below that show "New"

---

## Moderation
- No automated moderation in v1
- Admin can remove a review manually if reported
- Report button on each review: ⚠️ TBD for v1 scope
