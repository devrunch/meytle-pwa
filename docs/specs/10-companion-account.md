# 10 — Companion Account Settings

> `FE` 🟡 UI exists (tabs), no save logic · `BE` 🔲 Not started

At `/app/companion/account`. Three tabs: Profile, Payouts, Settings.

---

## Tab 1 — Profile

What the companion can edit:
- Display name
- Bio
- Profile photo (replace existing)
- Services offered (add or remove)
- Hourly rate

**Rules:**
- Changes to photo or ID-sensitive fields may re-trigger verification — ⚠️ TBD
- Rate changes take effect on new bookings only — existing confirmed bookings keep the old rate

---

## Tab 2 — Availability & Area

- Edit available days and hours
- Edit service area (reposition pin + adjust radius)

**Rules:**
- Changes only affect new bookings — existing confirmed bookings are not affected
- If companion removes all availability days, their profile is automatically set to offline

---

## Tab 3 — Payouts & Settings

**Payouts:**
- View saved bank account details (masked)
- Update bank account (requires re-entry of full details)
- View payout history (date, amount, booking reference)

**Settings:**
- Toggle profile active / inactive (same as "go offline" on the dashboard)
- Deactivate account — sets profile to inactive, hides from feed permanently until reactivated by contacting support
- Change password (redirects to auth flow)
- Notification preferences — ⚠️ TBD once notification spec is final
