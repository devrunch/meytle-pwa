# Meytle — UX/UI Polish Sprint (Full)
**Date:** 2026-05-26  
**Scope:** Full polish — color theme, role-aware nav, duplicate DOB removal, toasts, auth redesign, empty states, card image fallbacks, inline validation

---

## 1. Color Theme

Replace amber/gold tokens with teal/blue in `frontend/src/index.css` **only** — variable names stay identical so no component code changes are needed.

| Token | Old | New |
|---|---|---|
| `--color-amber` | `#C9920A` | `#00D4AA` |
| `--color-amber-light` | `#FEF3D0` | `#E6FAF6` |
| `--color-amber-dark` | `#7A5200` | `#007A60` |
| `--gradient-gold` | amber tones | `135deg, #00D4AA 0%, #00C2D8 50%, #4F8CFF 100%` |
| `--gradient-gold-h` | amber tones | `90deg, #00D4AA 0%, #4F8CFF 100%` |
| `--gradient-gold-text` | amber tones | `135deg, #00D4AA 0%, #4F8CFF 100%` |
| `--color-dark` | `#1A1A1A` | `#0F172A` |
| `--color-gray` | `#666666` | `#64748B` |
| `--color-gray-light` | `#F5F2EC` | `#F1F5F9` |
| `--color-border` | `#E8E4DC` | `#E8F1F0` |
| `--color-bg` | `#FAF9F7` | `#F7FBFA` |

Also update:
- Scrollbar gradient → teal (`#00D4AA → #00A082`)
- `scrollbar-color` Firefox fallback → `#00D4AA`
- Button primary shadow → `rgba(0,212,170,0.40)`
- `:focus-visible` outline → `var(--color-amber)` (already references token, auto-updates)
- Rename CSS utility classes: `btn-gradient-gold` → `btn-gradient-primary`, `text-gradient-gold` → `text-gradient-primary` (update `index.css` + `Button.tsx`)

---

## 2. Companion-Aware Navigation

### Problem
`AppLayout` always shows both "Companion Dashboard" and "Become a Companion" regardless of whether the user has a companion profile.

### Solution

**New store:** `frontend/src/store/companion.ts`  
Zustand store (non-persisted) with:
```ts
interface CompanionState {
  profileId: string | null      // null = no profile, string = has profile
  loading: boolean
  fetch: () => Promise<void>    // calls GET /companions/me/profile
  clear: () => void
}
```

**Where to call `fetch()`:** In `AppLayout` `useEffect` on mount (once per session). If the API returns 404, `profileId` stays null. If it returns a profile, store the `id`.

**Nav logic (AppLayout dropdown + ProfilePage CTA):**
- `profileId !== null` → show "Companion Dashboard" link only
- `profileId === null` → show "Become a Companion" link only
- Never both

**ProfilePage:** Remove the "Become a Companion" CTA card when `profileId !== null`. Show a "Go to Dashboard" button instead.

---

## 3. Remove Duplicate Date of Birth

### Problem
`RegisterPage` already collects `dateOfBirth`. Wizard step 3 asks for it again.

### Backend fix
In `backend/src/companions/dto/create-companion-profile.dto.ts`:
- Make `dateOfBirth` `@IsOptional()`

In `backend/src/companions/companions.service.ts` → `createProfile()`:
- If `dto.dateOfBirth` is absent, load the user record and use `user.dateOfBirth`

### Frontend fix
- Remove `dateOfBirth` state and input from `OnboardingWizard` step 3
- Remove `dateOfBirth` from the `POST /companions/me` payload
- Update `canProceed()` for step 3 — only requires `displayName`

---

## 4. Toast Error Wiring

`ToastProvider` is already in `App.tsx`. `useToast` hook is ready. Wire it to every significant catch block:

| File | Action | Toast message |
|---|---|---|
| `LoginPage` | Login failure | error: "Login failed" + server message |
| `RegisterPage` | Register failure | error: "Couldn't create account" + server message |
| `BookingFlow` | Submit booking | error: "Booking failed" + message; success: "Booking confirmed! 🎉" |
| `OnboardingWizard` | Submit profile | error: "Submission failed" + message; success: "Profile submitted!" |
| `CompanionAccount` | Each save (bio/rate/services/availability/photo) | success: "Saved" or error: "Couldn't save changes" |
| `CompanionDashboard` | Accept/Decline | success: "Booking accepted ✓" / "Booking declined"; error on failure |
| `companion/BookingDetail` | Accept/Decline | same as above |
| `MessagesPage` | Send message fail | error: "Message not sent" |

Remove redundant inline `setError` state from `LoginPage` and `RegisterPage` (replaced fully by toast + inline field errors per §5).

---

## 5. Auth Page Polish

### Layout
- **Mobile:** Single column, centred card, same as current
- **Desktop (≥768px):** Two-column split — left panel (brand/gradient, tagline, 3 feature bullets), right panel (form)
- Left panel uses `--gradient-primary`, white text, Meytle logo + name

### Form improvements

**Both pages:**
- Field border turns `--color-primary` on focus (already works via CSS vars after token swap)
- On blur: if field is empty + required → red border + inline error message below field
- Error message uses a small `IconAlertCircle` + text, not a banner

**RegisterPage specific:**
- Password field: show strength bar (weak/medium/strong) based on length + complexity
- DOB field: keep as-is (still required at registration for age verification)
- Remove generic error banner — individual field errors + toast covers it

**LoginPage specific:**
- "Forgot password?" link (non-functional for now, just visible)
- Remove generic error banner — toast covers it

---

## 6. Empty States

Each list screen gets a purposeful empty state (icon + headline + subtext + optional CTA):

| Screen | Condition | Icon | Headline | Subtext | CTA |
|---|---|---|---|---|---|
| `BookingsPage` | No bookings | `IconCalendarOff` | "No bookings yet" | "Browse companions and book your first experience" | "Discover companions" → `/app` |
| `MessagesPage` | No conversations | `IconMessageOff` | "No messages yet" | "Your conversations with companions appear here after booking" | none |
| `HomePage` | API returns empty array | `IconUsersOff` | "No companions found" | "Try a different filter or check back soon" | "Clear filters" |
| `CompanionDashboard` requests tab | No pending | `IconInbox` | "All clear!" | "New booking requests will appear here" | none |
| `CompanionDashboard` upcoming tab | Empty | `IconCalendarEvent` | "No upcoming bookings" | "Accepted bookings will appear here" | none |

Empty state component: `frontend/src/components/ui/EmptyState.tsx`  
Props: `icon`, `title`, `body`, `action?: { label: string; onClick: () => void }`

---

## 7. Companion Card Image Fallbacks

`CompanionCard` component — add `onError` handler to the `<img>`:

```tsx
<img
  src={avatarUrl}
  onError={e => { e.currentTarget.style.display = 'none'; setImgError(true) }}
/>
{imgError && (
  <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[#4F8CFF] flex items-center justify-center">
    <span className="text-white font-bold text-[22px]">{initials}</span>
  </div>
)}
```

Same pattern applied to: `CompanionProfile` hero photo, `BookingDetailPage` companion avatar, `BookingsPage` companion avatar, `ProfilePage` user avatar, `CompanionDashboard` avatar.

---

## 8. Inline Form Validation

Apply to fields most likely to cause user confusion:

- **RegisterPage / LoginPage:** per-field blur validation (empty check, email format, password min-length 8)
- **BookingFlow step 4 (summary):** if `meetingSpotText` is empty when user tries to continue, show inline error on the location field
- **CompanionAccount rate input:** if value < 500 on blur, show "Minimum rate is ₹500/hr"
- **OnboardingWizard step 3 displayName:** if empty on blur, show "Display name is required"

Pattern: a `fieldError` state per validated field, rendered as `<p className="text-[11px] text-[var(--color-error)] mt-1 flex items-center gap-1"><IconAlertCircle size={11}/> {msg}</p>` immediately below the input.

---

## Implementation Order

1. `index.css` token swap + `Button.tsx` class rename → instant visual impact
2. `companion.ts` store + `AppLayout` role-aware nav + `ProfilePage` CTA fix
3. Backend DOB optional + wizard DOB removal
4. Toast wiring across all catch blocks
5. `EmptyState` component + wire to all list screens
6. `CompanionCard` + avatar image fallbacks
7. Auth page desktop split layout + inline validation
8. Inline validation on remaining forms

---

## Out of Scope (this sprint)

- Stripe payment UI
- Real notification delivery
- Selfie/ID upload (wizard steps 6–7 remain stubs)
- Map drawing for service area
