# 12 — Notifications

> `FE` 🔲 Not started · `BE` 🔲 Not started

---

## v1 scope: in-app only

No push notifications, no email, no SMS in v1.
Notifications appear in the bell icon in the top nav.

---

## Trigger table

| Event | Who gets notified | Message |
|-------|------------------|---------|
| New booking request received | Companion | "{User name} wants to book a {service} on {date}" |
| Booking confirmed by companion | User | "{Companion name} confirmed your booking for {date}" |
| Booking declined by companion | User | "{Companion name} couldn't take your {date} booking" |
| Booking request auto-expired (24h) | User | "Your request expired — {Companion name} didn't respond in time" |
| Booking cancelled by user | Companion | "{User name} cancelled the {date} booking" |
| Booking cancelled by companion | User | "{Companion name} cancelled your {date} booking" |
| New message received | Other party | "{Name}: {message preview up to 40 chars}" |
| Booking completed, review available | User | "How was your time with {Companion name}? Leave a review" |
| Chat window opening soon (3h before) | Both | "Your booking with {name} starts in 3 hours — chat is now open" |

---

## Behaviour

- Unread notifications count shown as a badge on the bell icon
- Clicking the bell opens a dropdown list of recent notifications (last 20)
- Clicking a notification navigates to the relevant booking or message thread
- Marking all as read clears the badge

---

## Future (v2)
- Push notifications (PWA Web Push)
- Email for booking confirmations and cancellations
- SMS for booking reminders (1 hour before)
