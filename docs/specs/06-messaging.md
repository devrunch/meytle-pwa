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

## Who can send the first message ✅ Confirmed

**Either party can initiate** — the user does not need to wait for the companion to go first.
The only gating is the access window below.

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

| State | When | UI shown |
|-------|------|----------|
| Not confirmed | Booking still `pending` | "Chat is available once the booking is confirmed" |
| Too early | Before 3h window | "Chat opens at 12:00 PM — 3 hours before your booking" with a countdown |
| Open | Inside window | Full chat interface — either party can send first |
| Session ended | After 2h grace | Read-only thread + "This session has ended" banner |

**Access is enforced server-side** — the WebSocket gateway rejects emits outside the window. The UI state is informational only.

---

## If booking is cancelled after confirmation ✅ Confirmed

**Bookings cannot be cancelled by either party once confirmed.**
Cancellation after confirmation requires contacting **admin / customer support**.

- If support cancels the booking: thread immediately becomes **read-only**
- Messages are retained and visible to both parties in read-only mode
- No new messages can be sent once a booking moves to `cancelled` regardless of how it got there

---

## Phone number sharing ✅ Confirmed — Not allowed

- Phone numbers (and any sequence matching a phone pattern) are **blocked** server-side before delivery
- Pattern to block: any string of 10+ consecutive digits, or common formats like `+91XXXXXXXXXX`
- Blocked message is not delivered — sender sees: "Sharing contact details is not allowed"
- Repeat violations flagged for moderation

---

## What can be sent

- Plain text only — no attachments, images, or links in v1
- Maximum 500 characters per message
- Phone number patterns are filtered (see above)
- Sending an empty message is blocked client and server side

---

## Message list (`/app/messages`)

- Shows all threads where the access window is open **or** closed within the last 24 hours
- Each row: other party's photo, name, booking date, last message preview (40 chars), unread badge
- Sorted by most recent message first
- Threads beyond 24h post-close are archived (not shown, but accessible via booking detail)

---

## Thread view (`/app/messages/:bookingId`)

- Messages from self on the right, other party on the left
- Timestamp per message (time only; full date if from a previous day)
- Auto-scrolls to bottom on open and on new message received
- Input bar shows lock state label when outside access window
- Typing indicator: not in v1

---

## Unread count

- Bottom nav badge = total unread messages across all open threads
- Cleared when user opens that thread
- Updated in real time via Socket.IO
