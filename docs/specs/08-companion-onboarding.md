# 08 — Companion Onboarding

> `FE` 🟡 Wizard UI exists, no validation or API · `BE` 🔲 Not started
> **Verification: Stripe Identity** ✅ Confirmed · **Go-live: after verification** ✅ Confirmed · **Min age: 18** ✅ Confirmed

Multi-step wizard at `/app/companion/onboarding`. Completed once per account.

---

## Who sees it
Any logged-in user without the companion role.
Entry point: profile dropdown → "Become a Companion".

---

## Steps

### Step 1 — Basic Info
- Display name (shown publicly — can differ from account name)
- Date of birth — must be 18 or older at time of submission (server-validated)
- Short bio (max 300 characters)
- Profile photo — required, upload from device, stored via Stripe or our CDN

### Step 2 — Services
- Pick from: Coffee, Dining, Concert, Travel, Fitness, Culture, Nature, Movies, Shopping, Gaming
- At least one required

### Step 3 — Availability
- Toggle days of the week (Mon–Sun)
- Set general hours: from time → to time (same window for all selected days in v1)
- At least one day required
- These are the "regular schedule" days shown as available on the booking calendar

### Step 4 — Service Area
- Map centred on NCR
- Drop a pin at their preferred base / meeting zone
- Set a radius (1 km – 30 km slider)
- The radius circle is shown to users on the booking map

### Step 5 — Pricing
- Set hourly rate (₹ per hour)
- Minimum: ₹500/hr
- Shown as "from ₹X/hr" on their card in the feed

### Step 6 — Identity Verification (Stripe Identity)
- Single tap: "Verify your identity" → opens Stripe Identity hosted flow
- Companion completes ID check inside Stripe's UI (we never see the ID document)
- Stripe checks: document authenticity, face match, age ≥ 18
- Veriff is the fallback if Stripe Identity is not available in their region — ⚠️ confirm availability for India (Q12)
- After submission, companion sees: "Verification in progress — usually takes a few minutes"
- Stripe sends a webhook when done (see `11-payments` webhook table)

**Verification outcomes:**

| Stripe result | What happens |
|---------------|-------------|
| `verified` | Companion profile activated automatically, companion notified |
| `requires_input` | Companion asked to re-submit with a clearer photo |
| `failed` | Companion notified, cannot proceed — support link shown |

### Step 7 — Payout Setup (Stripe Connect)
- Single tap: "Set up payouts" → opens Stripe Connect Express onboarding
- Stripe collects: name, DOB, Indian bank account + IFSC, PAN (tax)
- We store only the `stripeConnectedAccountId` returned by Stripe
- If companion skips this step, they can complete it from Companion Account → Payouts later
- **Payouts are only released once this step is complete** — bookings can still be accepted without it, but earnings are held until bank is linked

---

## Profile status flow

```
Onboarding submitted
        │
        ▼
status: pendingVerification
(profile hidden from feed)
        │
  Stripe Identity webhook: verified
        │
        ▼
status: active
(profile visible in feed)
```

---

## After onboarding
- Account gains `companion` role in the DB
- Companion is redirected to their dashboard
- Profile is live in the NCR feed once `active`

---

## Can companions edit their profile after onboarding?
Yes — via Companion Account Settings (`10-companion-account`). Changes to profile photo or name trigger a re-verification prompt.
