# 06 — Messaging

> `FE` 🟡 UI exists, no WebSocket or access rules · `BE` 🔲 Not started
> **Real-time: WebSockets (Socket.IO)** ✅ Confirmed

---

## What it is

Text chat between a user and a companion, scoped to one booking.
Not a general inbox — every conversation belongs to exactly one booking.

---

## Tech

- **Socket.IO** on NestJS (`@nestjs/websockets` + `socket.io`)
- Client connects with JWT in the handshake — authenticated the same way as REST
- Each booking gets its own Socket.IO room: `booking:{bookingId}`
- Both parties join that room when they open the thread
- Fallback: Socket.IO automatically falls back to long-polling if WebSocket is unavailable

---

## Access rules

A message thread is **readable and writable** only when ALL conditions are true:

| # | Condition |
|---|-----------|
| 1 | Booking status is `confirmed` |
| 2 | Current server time ≥ booking `startTime` minus 3 hours |
| 3 | Current server time ≤ booking `endTime` plus 2 hours |

**Access window example:**
```
Booking: May 25, 3:00 PM – 5:00 PM (2h session)

Chat opens:   May 25, 12:00 PM  (3h before start)
Chat closes:  May 25,  7:00 PM  (2h after end)
```

**Access states shown in UI:**

| State | When | UI |
|-------|------|----|
| Too early | Before window | "Chat opens at 12:00 PM — 3 hours before your booking" |
| Open | During window | Full chat interface |
| Session ended | After window | Read-only, "This session has ended" banner |
| Booking not confirmed | Status is pending/cancelled | "Chat is only available for confirmed bookings" |

**Access is enforced server-side** — the WebSocket gateway checks conditions on every message emit. The UI state is a convenience only.

---

## What can be sent

- Plain text only — no attachments, images, or links in v1
- Maximum 500 characters per message
- Sending an empty message is blocked client and server side

---

## Message list (`/app/messages`)

- Shows all message threads the user is part of where the access window is open **or** closed within the last 24 hours
- Each row: other party's photo, name, booking date, last message preview (40 chars), unread badge
- Sorted by most recent message first
- Threads outside the 24h post-close window are archived and not shown

---

## Thread view (`/app/messages/:bookingId`)

- Messages from self on the right, other party on the left
- Timestamp shown per message (time only; full date if message is from a previous day)
- Auto-scrolls to bottom on open and on new message received
- Input bar disabled with a label when outside the access window
- Typing indicator: ⚠️ nice to have, not required for v1

---

## Unread count

- Bottom nav badge = total unread messages across all open threads
- Cleared when user opens that thread (marks all as read)
- Updated in real time via the Socket.IO connection

---

## Open conditions to confirm

| # | Question | Default if not answered |
|---|----------|------------------------|
| Q9 | Can the user send the first message, or only the companion? | Either party can initiate |
| Q10 | What happens to messages if booking is cancelled post-confirmation? | Thread becomes read-only immediately |
| Q11 | Can companions share phone numbers in chat? | Not blocked in v1, flag for moderation in v2 |
