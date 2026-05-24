# 00 — Product Overview

## What is Meytle?
A platform where people find and book a real companion to join them for experiences — coffee, dining, concerts, travel, fitness, and more. The companion is a verified individual, not a service business.

## The two sides

| Role | What they do |
|------|-------------|
| **User** | Browses companions, books a session, pays, and reviews |
| **Companion** | Lists themselves, sets availability, accepts bookings, earns money |

One account can be both. Becoming a companion is an optional onboarding flow done after registration.

## How money works
- User pays the full amount at booking confirmation
- Meytle holds the payment until the session is completed
- On completion: companion receives the amount minus a **5% platform fee**
- If companion declines: full refund to user
- Cancellation policy: ⚠️ TBD — see Open Questions

## Cities in scope for v1
⚠️ TBD — see Open Questions

---

## Open Questions

Resolve these before building the affected modules.

| # | Question | Affects | Owner |
|---|----------|---------|-------|
| Q1 | Razorpay or Stripe as payment gateway? | `11-payments` | Client |
| Q2 | Is the 5% fee added on top for user, or deducted from companion payout? | `11-payments` | Client |
| Q3 | Cancellation policy — how many hours before, what % refund? | `04-booking-flow`, `05-booking-management`, `11-payments` | Client |
| Q4 | Do companions go live instantly after onboarding, or after admin approval? | `08-companion-onboarding` | Client |
| Q5 | Which cities are in scope for v1 launch? | `02-discovery` | Client |
| Q6 | Minimum age for companions? Any additional verification beyond ID? | `08-companion-onboarding` | Client / Legal |
| Q7 | Messaging — real-time (WebSocket) or polling in v1? | `06-messaging` | Tech |
| Q8 | Are custom booking requests (off-schedule days) in scope for v1? | `04-booking-flow` | Client |
