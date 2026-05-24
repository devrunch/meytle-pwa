# 06 — Messaging

> `FE` 🟡 UI exists, no real-time or access rules · `BE` 🔲 Not started

---

## What it is

A simple text chat between a user and a companion, scoped to a specific booking.
Not a general inbox — every conversation is tied to one booking.

---

## Access rules

A message thread is **only accessible** when ALL of the following are true:

1. The booking status is `confirmed` (not `pending`, not `completed`, not `cancelled`)
2. The current time is **within 3 hours before the booking start time** OR the session is currently ongoing
3. The session has not ended more than **2 hours ago** (grace period for post-session wrap-up messages)

> **Example:** Booking on May 25 at 3:00 PM for 2 hours (ends 5:00 PM)
> - Chat opens: May 25 at 12:00 PM (3h before start)
> - Chat closes: May 25 at 7:00 PM (2h after end)

**Before the window opens:** Show a locked state — "Chat opens 3 hours before your booking"
**After the window closes:** Show messages as read-only — "This booking has ended"

---

## What you can send

- Plain text messages only
- No file attachments, photos, or links in v1
- Maximum message length: 500 characters

---

## Message list (`/app/messages`)

- Shows all bookings the logged-in user has an active or recent message thread for
- Each row: companion/user photo, name, last message preview, timestamp, unread count
- Tapping a row opens the thread
- Only shows threads where the access window is open OR has recently closed (within 24h)

---

## Thread view (`/app/messages/:conversationId`)

- Standard chat layout: messages from current user on the right, other party on the left
- Shows timestamps per message
- Auto-scrolls to the latest message on open
- Real-time updates: ⚠️ WebSocket vs polling — see Q7 in `00-overview`

---

## Unread count

- Bottom nav badge shows total unread messages across all open threads
- Cleared when the user opens that thread

---

## Open conditions to confirm

- [ ] Can user initiate a message, or does the companion always go first?
- [ ] Is there a character limit per message?
- [ ] Should the companion be able to share their phone number via chat? (safety concern)
- [ ] What happens to messages if a booking is cancelled after confirmation?
