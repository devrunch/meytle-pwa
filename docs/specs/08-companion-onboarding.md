# 08 — Companion Onboarding

> `FE` 🟡 Wizard UI exists, no validation or API · `BE` 🔲 Not started
> **Verification: Stripe Identity → Veriff → Admin manual** ✅ Confirmed · **Min age: 18** ✅ Confirmed

Multi-step wizard at `/app/companion/onboarding`. Completed once per account.

---

## Who sees it
Any logged-in user without the companion role.
Entry point: profile dropdown → "Become a Companion".

---

## Steps

### Step 1 — Basic Info
- Display name (shown publicly — can differ from account name)
- Date of birth — must be 18 or older at submission (server-validated, not just client)
- Short bio (max 300 characters)
- Profile photo — required, upload from device

### Step 2 — Services
- Pick from: Coffee, Dining, Concert, Travel, Fitness, Culture, Nature, Movies, Shopping, Gaming
- At least one required

### Step 3 — Availability
- Toggle days of the week (Mon–Sun)
- General hours: from time → to time (same window for all selected days in v1)
- At least one day required

### Step 4 — Service Area
- Map centred on NCR
- Drop a pin at their preferred meeting zone
- Set a radius (1 km – 30 km slider)
- Radius circle is shown to users on the booking map

### Step 5 — Pricing
- Hourly rate in ₹ — minimum ₹500/hr
- Shown as "from ₹X/hr" on their card in the feed

### Step 6 — Identity Verification

Three-tier fallback chain — attempted in order:

```
Tier 1: Stripe Identity
  ↓ (if unavailable in region or fails to load)
Tier 2: Veriff
  ↓ (if Veriff also unavailable or companion needs help)
Tier 3: Admin manual review
```

**Tier 1 — Stripe Identity (preferred)**
- Single tap: "Verify your identity" → opens Stripe Identity hosted flow
- Stripe checks: document authenticity, liveness, face match, age ≥ 18
- We never see the ID document — Stripe handles it entirely
- Webhook event `identity.verification_session.verified` activates the profile

**Tier 2 — Veriff (fallback)**
- Triggered automatically if Stripe Identity session cannot be created
- Same UX: single tap → opens Veriff hosted flow
- Veriff webhook → our backend maps result to same internal verification status
- Covers: Aadhaar, PAN, Passport, Driving Licence

**Tier 3 — Admin manual review (last resort)**
- Triggered if both Stripe Identity and Veriff are unavailable
- Companion uploads a photo of their government ID directly to us (stored securely, deleted after review)
- Admin reviews in the admin panel and approves or rejects
- SLA: within 24 business hours
- Companion sees: "Manual review in progress — we'll notify you within 24 hours"

**All tiers check age ≥ 18.** If age cannot be confirmed from the document, the verification fails regardless of tier.

**Verification outcomes (all tiers):**

| Result | What happens |
|--------|-------------|
| Verified | Profile status → `active`, companion notified, shown in feed |
| Needs resubmission | Companion asked to retry with clearer photo |
| Failed / underage | Companion notified, cannot proceed, support link shown |

### Step 7 — Payout Setup (Stripe Connect Express)

- Single tap: "Set up payouts" → opens Stripe Connect Express onboarding
- Stripe collects: name, DOB, Indian bank account + IFSC, PAN for tax
- We store only the `stripeConnectedAccountId` — we never see bank details
- This step can be skipped and completed later from Companion Account → Payouts
- **Payouts are held until this step is completed** — bookings work, but earnings stay pending

---

## Profile status flow

```
Step 1–7 submitted
        │
        ▼
  status: pendingVerification
  (hidden from feed)
        │
        ├─ Stripe Identity verified ──────────────┐
        │                                         │
        ├─ Veriff verified ───────────────────────┤
        │                                         ▼
        └─ Admin approves manually ──── status: active
                                        (visible in NCR feed)
```

---

## After onboarding
- Account gains `companion` role
- Companion redirected to their dashboard
- Profile visible in NCR feed once `active`

---

## Editing after onboarding
Via Companion Account Settings (`10-companion-account`).
Changes to **profile photo or display name** trigger a re-verification notice — admin review only (not full Stripe Identity re-run).
