# 08 — Companion Onboarding

> `FE` 🟡 Wizard UI exists, no validation or API · `BE` 🔲 Not started

Multi-step wizard at `/app/companion/onboarding`. Only completed once per account.

---

## Who sees it
Any logged-in user who does not yet have the companion role.
Accessible from the profile dropdown ("Become a Companion").

---

## Steps

### Step 1 — Basic Info
- Display name (shown publicly — can differ from account name)
- Age (must be 18 or over — ⚠️ minimum age TBD, see Q6 in `00-overview`)
- Short bio (max 300 characters)
- Profile photo (required — upload from device)

### Step 2 — Services
- Checkboxes for all experience types: Coffee, Dining, Concert, Travel, Fitness, Culture, Nature, Movies, Shopping, Gaming
- At least one must be selected

### Step 3 — Availability
- Day-of-week toggles (Mon–Sun)
- General available hours (from time → to time, same for all selected days in v1)
- At least one day must be selected

### Step 4 — Service Area
- Map: drop a pin at their base location (home area or preferred meeting zone)
- Set a radius (km) — how far they are willing to travel
- Minimum radius: 1 km

### Step 5 — Pricing
- Set hourly rate in ₹
- Minimum ₹500/hr
- Platform shows this as "from ₹X/hr" on their card

### Step 6 — ID Verification
- Upload a photo of a government-issued ID (Aadhaar, PAN, Passport, Driving Licence)
- Status shown as "Verification pending"
- Companion profile goes live only after admin approves — ⚠️ or instantly, see Q4 in `00-overview`

### Step 7 — Bank Details
- Account holder name
- Bank account number
- IFSC code
- Stored securely for payouts — not shown to users

---

## On completion
- Account gains companion role
- If instant go-live: profile becomes visible in the feed
- If admin approval required: profile set to `pendingVerification`, companion sees a "Under review" status

---

## Can companions edit their profile after onboarding?
Yes — via Companion Account Settings (`10-companion-account`).
