# Meytle — Frontend Design Specification
> Version 1.0 · May 2026 · Source: Design Handoff DOCX + brainstorming session

---

## 1. Product Overview

Meytle is a companion discovery platform. Users browse verified companions by city and experience type, view profiles, and book in real-time. The frontend is a mobile-first PWA built with Vite + React.

**Two user modes in one account:**
- **User mode** — default after signup. Browse, book, message.
- **Companion mode** — unlocked via "Become a Companion" CTA in profile. Requires completing a multi-step onboarding and passing admin verification.

**No role selection at signup.** Everyone registers as a user. Companion onboarding is triggered in-app.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 (using CSS custom properties for design tokens) |
| Routing | React Router v6 |
| Map | Mapbox GL JS (browse map + companion area drawing) |
| Icons | Tabler Icons React (outline only, `stroke={1.5}`) |
| Payments | Stripe.js (embedded checkout) |
| Camera | MediaDevices API + face-api.js (selfie validation) |
| PWA | Vite PWA plugin (service worker, manifest) |
| State | Zustand (lightweight, no boilerplate) |
| HTTP | Axios with interceptors |

---

## 3. Design Tokens

All tokens are CSS custom properties on `:root`. Never hardcode hex values in components.

### 3.1 Color Palette

```css
:root {
  /* Primary */
  --color-amber:        #BA7517;
  --color-amber-light:  #FAEEDA;
  --color-amber-dark:   #633806;

  /* Neutrals */
  --color-dark:         #1A1A1A;
  --color-gray:         #666666;
  --color-gray-light:   #F5F2EC;
  --color-border:       #E8E4DC;
  --color-bg:           #FAF9F7;
  --color-white:        #FFFFFF;

  /* Semantic */
  --color-success:      #0F6E56;
  --color-success-bg:   #E1F5EE;
  --color-error:        #A32D2D;
  --color-error-bg:     #FCEBEB;
}
```

### 3.2 Typography

All text uses **Inter**. Fallback: `system-ui, sans-serif`. Load via Google Fonts (weight 400, 500).

| Role | Size | Weight | Line-height | Color | Notes |
|---|---|---|---|---|---|
| Hero H1 | 48px desktop / 28px mobile | 500 | 1.15 | `--color-dark` | Accent word in `--color-amber` |
| H2 section | 32px | 500 | 1.2 | `--color-dark` | |
| H3 card title | 20px | 500 | 1.3 | `--color-dark` | |
| Body default | 15px | 400 | 1.6 | `--color-gray` | |
| Caption / label | 11px | 500 | 1.45 | varies | Uppercase, letter-spacing 0.06em |
| Price | 14px | 500 | 1.43 | `--color-dark` | Format: `$60/hr` or `₹800/hr` |
| Bio snippet | 12px | 400 | 1.5 | `#555555` | 80 char max on cards |

### 3.3 Spacing Scale

```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   12px;
--space-lg:   16px;
--space-xl:   24px;
--space-2xl:  32px;
--space-3xl:  48px;
```

### 3.4 Border Radius

```css
--radius-sm:   6px;     /* pills, tags */
--radius-md:   8px;     /* buttons, inputs */
--radius-lg:   12px;    /* cards */
--radius-xl:   16px;    /* large cards, modals */
--radius-full: 9999px;  /* avatar circles, chip badges */
```

---

## 4. Responsive Breakpoints

| Name | Width | Layout changes |
|---|---|---|
| Mobile | < 768px | Single column, horizontal chip scroll, stacked nav inputs |
| Tablet | 768px – 1279px | 2-col companion grid, nav links visible |
| Desktop | >= 1280px | 3-col companion grid, full nav, 2-col hero |

**Max content width:** 1280px, centered with `margin: 0 auto`.

**Section horizontal padding:**
- Mobile: 24px
- Tablet: 48px
- Desktop: 80px

---

## 5. Global Components

### 5.1 Navigation Bar (sticky, desktop)

- `position: sticky; top: 0; z-index: 100`
- Height: 52px
- Background: `#FFFFFF` with `border-bottom: 0.5px solid var(--color-border)`
- Logo: 28×28px amber rounded square icon + "Meytle" text (Inter 500 15px)
- Nav links: Inter 400, 13px, `--color-gray`, gap 20px
- **Log In button:** ghost — transparent bg, 0.5px border, `7px 14px` padding, `border-radius: 8px`
- **Join Now button:** filled amber — `bg: --color-amber`, white text, no border, `7px 16px` padding
- Mobile: collapse links into hamburger at < 768px. Keep both CTA buttons visible.

### 5.2 Mobile Bottom Navigation

Five tabs: **Home · Map · Messages · Bookings · Profile**

- Height: 52px + safe-area-inset-bottom
- Background: white, `border-top: 0.5px solid var(--color-border)`
- Active tab: icon + label in `--color-amber`, font-weight 600
- Inactive: `#999999`
- Icons: Tabler Icons, size 20px, stroke 1.5

### 5.3 Buttons

| Variant | Style |
|---|---|
| Primary | `bg: --color-amber`, white text, `border-radius: --radius-md` |
| Ghost | transparent bg, `border: 0.5px solid #CCC`, `color: --color-gray` |
| Outline amber | `border: 1.5px solid --color-amber`, `color: --color-amber`, transparent bg |
| Destructive | `bg: --color-error`, white text |

**States:**
- Hover (primary): `bg: #9E6313` (darken 10%), `transition: background 150ms ease`
- Active: `transform: scale(0.98)`
- Disabled: `opacity: 0.45`, `cursor: not-allowed`, `pointer-events: none`
- Focus (all): `outline: 2px solid --color-amber`, `outline-offset: 2px`

### 5.4 Inputs

| State | Style |
|---|---|
| Default | `border: 0.5px solid #D8D4CC`, `bg: --color-bg` |
| Focus | `border-color: --color-amber`, `box-shadow: 0 0 0 3px rgba(186,117,23,0.15)` |
| Error | `border-color: --color-error`, `bg: --color-error-bg` |
| Disabled | `opacity: 0.5`, `bg: --color-gray-light`, `cursor: not-allowed` |

Height: 36px (compact) / 44px (forms). `border-radius: --radius-md`.

### 5.5 Companion Card

Used in grids and horizontal scrolls.

- Background: white
- Border: `0.5px solid var(--color-border)`
- Border-radius: `--radius-lg`
- Hover: `border-color: --color-amber`, `transform: translateY(-2px)`, `transition: 150ms ease`
- Avatar area: photo or colored bg with initial letter (28px bold white)
- Verified badge: 18×18px circle, `bg: --color-amber`, top-right, checkmark 10px white
- Name: Inter 500, 13px
- Location: 11px, `#888`, with `IconMapPin`
- Bio snippet: 11px, `#555`, 80 char max, `border-left: 2px solid --color-amber-light`, `padding-left: 8px`
- Tags: flex wrap, 10px, `bg: #F5F2EC`, `border-radius: 20px`, `padding: 2px 7px`
- Price: Inter 500, 13px, `$X/hr` format
- Availability pill: `bg: --color-success-bg`, `color: --color-success`, 10px, `border-radius: 20px`

**Grid breakpoints:**
- Desktop: 3 columns, gap 12px
- Tablet: 2 columns
- Mobile: 1 column (vertical) or horizontal scroll carousel

### 5.6 Experience Category Card

- Size: ~150px wide × 120px tall (desktop) / 90px × 70px (mobile)
- `border-radius: 10px`
- Background photo with `linear-gradient(transparent, rgba(0,0,0,0.6))` overlay on bottom 40%
- Label: 12px, white, `font-weight: 500`, bottom-left, 8px padding
- Icon: 18px Tabler outline, white, above label
- Hover: `transform: scale(1.03)`, `transition: 200ms ease`

**Categories:**
Coffee Dates · Fine Dining · Concert Partner · Travel Companion · Fitness Buddy · Cultural Events · Nature Walks · Movies · Shopping

### 5.7 Filter Chips

- Default: `border: 0.5px solid #D8D4CC`, white bg, `#555` text, `padding: 4px 12px`, `border-radius: 20px`, 11px
- Active: `bg: --color-amber-light`, `border-color: --color-amber`, `color: --color-amber-dark`, `font-weight: 500`
- Mobile: `overflow-x: auto`, no wrap, `-webkit-overflow-scrolling: touch`

---

## 6. App Screen Map

### 6.1 Public / Pre-auth Pages

| Screen | Route | Notes |
|---|---|---|
| Homepage (marketing) | `/` | Desktop-first landing page |
| Browse companions | `/browse` | Filter + grid, no auth required to view |
| Companion public profile | `/companions/:id` | View profile, auth required to book |
| How it works | `/how-it-works` | |
| Pricing | `/pricing` | |
| Safety | `/safety` | |
| Login / Register | `/login`, `/register` | |

### 6.2 Auth Onboarding (new user)

Sequential screens, mobile-first, one action per screen:

1. Welcome / splash (app intro)
2. Email + password
3. Your name
4. Profile photo (optional — can skip)
5. You're in! (success screen)

### 6.3 Main App (authenticated user)

Bottom tab navigation on mobile. Sidebar on desktop.

| Tab | Route | Description |
|---|---|---|
| Home | `/app` | Location header, action cards, filter chips, companion carousel, experience categories |
| Map | `/app/map` | Mapbox — companion pins in user's area, tap to view profile |
| Messages | `/app/messages` | Conversation list + chat thread |
| Bookings | `/app/bookings` | Upcoming, past, pending approval |
| Profile | `/app/profile` | Account settings, preferences, "Become a Companion" CTA |

### 6.4 Booking Flow

Triggered from companion profile → "Book Now":

1. Select date + time slot (calendar view of companion's availability)
2. ID verification screen (first booking only — camera capture)
3. Stripe payment
4. Confirmation — "Waiting for companion approval"
5. Post-experience review (triggered after booking date passes)

### 6.5 Companion Onboarding (6 steps)

Triggered from Profile → "Become a Companion". Full-screen modal wizard, mobile-first, one screen per step.

| Step | Screen | Key interaction |
|---|---|---|
| 1 | Choose services | Chip multi-select grid + hourly rate input per service |
| 2 | Set availability | Weekly day/time picker + recurrence options + reminder copy |
| 3 | Service areas | Mapbox — draw circles on map (multiple areas, no GPS required) |
| 4 | Profile photos | Upload up to 6 photos (drag-and-drop desktop / tap mobile) |
| 5 | Selfie verification | Camera permission prompt → live camera → face-api.js validation → capture |
| 6 | ID card capture | Camera → front of ID → back of ID → submit |
| — | Submitted | Pending admin review screen. Stripe payout link sent after approval. |

**Progress indicator:** Thin segmented bar at top (6 segments), fills left to right as user advances.

### 6.6 Companion Dashboard

Unlocked after admin approval. Replaces or augments the home tab.

| Section | Description |
|---|---|
| Booking requests | Cards with approve / decline actions, inline booking details |
| Calendar | Month + week view of confirmed bookings |
| Earnings | Total earned, payout history, Stripe connect status |
| Service areas | Live Mapbox — edit/delete/add circles in real-time |
| Edit profile | Services, prices, photos, bio, availability |
| Status toggle | Active / Away — shown on profile card when Away |

---

## 7. Key Screen Designs

### 7.1 Homepage (Desktop marketing page)

**Section order (top to bottom):**

1. Sticky nav (52px)
2. Hero — 2-col grid: left = headline + CTAs + microcopy, right = hero photo + floating rating badge
3. Trust bar — 4 icons: ID Verified · Secure Payments · Private Messaging · Background Checks
4. Search & filter bar — city input + experience type select + date select + search button + chip row
5. Experience categories row — horizontal scroll of 6 category cards
6. Featured companions grid — horizontal scroll, "View all" link
7. How it works — 3 steps: Discover · Connect · Meet (with dotted connector line)
8. Stats row — 10,000+ Experiences · 4.9 Average Rating · 50+ Cities · 95% Positive Reviews
9. Testimonials — 3 cards, each with specific experience mention
10. Footer CTA — centered, one primary + one outline button
11. Footer nav — Company · Safety · Support · Legal columns

**Hero details:**
- Eyebrow: 11px uppercase amber, "FIND YOUR COMPANION"
- H1: "Find Meaningful Company For Every **Experience**" (Experience in amber)
- Body: 13px gray, max-width 400px
- Primary CTA: "Explore Companions" (filled amber, with search icon)
- Secondary CTA: "Become a Companion" (outline)
- Micro copy below CTAs: "Free to browse — No credit card required", 11px #999
- Hero photo: border-radius 12px, height 200px (desktop), natural warm lighting
- Rating badge: absolute bottom-right, white card, 0.5px border, border-radius 10px, padding 8px 12px

### 7.2 Home Tab (Mobile app)

- **Top bar (sticky):** "Your area" label + location name + down chevron (left) · Notification bell (right)
- **Search bar:** full width, `bg: --color-bg`, border, search icon left
- **Action cards 2×2:** Find a Companion (dark) · Become a Companion (amber) · Explore Map (amber-light) · My Bookings (outline)
- **Filter chips:** horizontal scroll — All · Coffee · Fine Dining · Concerts · Travel · Fitness · Culture
- **"Available Now" section:** horizontal companion card scroll
- **"Experiences" section:** horizontal experience category card scroll

### 7.3 Map Tab

- Full-screen Mapbox map, z-index below bottom nav
- Floating search pill at top: "Search this area" with location icon
- Companion pins: amber circle markers, cluster at zoom-out
- Bottom sheet: slides up on pin tap — companion mini-card with "View Profile" button
- Filter FAB: bottom-right floating button — opens experience type filter sheet

### 7.4 Companion Profile (full page)

- Photo gallery: full-width swipeable (top of screen)
- Sticky header on scroll: name + price + "Book" button
- Sections: About · Services & Prices · Availability · Service Areas (small map) · Reviews

### 7.5 Companion Onboarding — Step 3: Service Areas (Map)

- Full-screen Mapbox map
- Floating instruction card at top: "Draw circles to mark where you're available"
- Draw mode: user clicks/taps center, drags to set radius
- Each circle: amber fill (20% opacity), amber stroke 2px, deletable via X button on circle
- Multiple circles allowed
- "Add another area" button (outline) at bottom
- "Done" primary button saves all areas

### 7.6 Companion Onboarding — Step 5: Selfie

- Permission screen first: camera icon + explanation text + "Allow Camera" primary button + "Not now" link
- Live camera view: full-screen, amber oval face guide overlay
- Status indicator: "Align your face within the oval" → (face-api detects face) → "Hold still..." → "Perfect"
- Capture: auto-triggers after 2s of valid face detection, or manual shutter button
- Review: shows captured photo + "Looks good" / "Retake" options

---

## 8. Icons

Use **Tabler Icons React** — outline style only, `stroke={1.5}`. Never use filled variants.

```bash
npm install @tabler/icons-react
```

```tsx
import { IconSearch, IconMapPin, IconShieldCheck } from '@tabler/icons-react'
// Usage
<IconSearch size={16} stroke={1.5} color="var(--color-amber)" />
```

| Section | Icons |
|---|---|
| Nav logo | `IconUsers` |
| Trust bar | `IconShieldCheck` / `IconLock` / `IconMessage` / `IconId` |
| Companion card | `IconMapPin` / `IconCheck` |
| Experience categories | `IconCoffee` / `IconChefHat` / `IconMusic` / `IconPlane` / `IconRun` / `IconBuildingArch` |
| How it works | `IconSearch` / `IconMessages` / `IconHeart` |
| Bottom nav | `IconHome` / `IconMap` / `IconMessageCircle` / `IconCalendar` / `IconUser` |
| Companion dashboard | `IconCalendar` / `IconCash` / `IconBell` / `IconEdit` |

---

## 9. Accessibility

All components must meet **WCAG 2.1 AA**.

- Minimum contrast ratio: 4.5:1 for body, 3:1 for large text (18px+)
- All interactive elements: visible focus styles — `outline: 2px solid var(--color-amber); outline-offset: 2px`
- Images: descriptive `alt` text. Decorative images use `alt=""`
- Buttons without visible label: require `aria-label`
- Companion cards: keyboard navigable (`tabIndex={0}`, Enter/Space to open)
- Color is never the sole indicator of state — always pair with icon or text
- Filter result changes announce count via `aria-live="polite"`
- Camera permission errors surface as visible text, not just console

```tsx
// Screen reader utility
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

// Live region for filter results
<div aria-live="polite" className="sr-only">
  {filteredCount} companions found
</div>
```

---

## 10. Design Rules — Do Not Violate

- Never use two filled buttons side by side — always one primary, one outline
- Never hardcode hex values in component files — always use CSS variables
- Never use drop shadows or gradients on cards/buttons (flat design language)
- Never add `border-radius` to single-sided borders (border-left only)
- No emojis in production UI — use Tabler Icons instead
- AI-generated placeholder photos are acceptable in dev only — production must use real verified member photos
- Tabler Icons: outline style only, never filled variants
- The word "Experience" in the hero H1 always renders in `--color-amber`
- Stripe payout setup happens after admin approval, not during onboarding
- Camera capture for ID: no gallery upload allowed — camera only

---

## 11. Image Guidelines

| Asset | Size | Format |
|---|---|---|
| Hero photo | min 800×600px | WebP + JPEG fallback |
| Companion avatar | 400×400px, face centred | WebP + JPEG fallback |
| Experience category | 400×300px, high contrast for overlay | WebP + JPEG fallback |

Use Next.js `<Image>` or `loading="lazy"` on all non-hero images. Hero image: eager load.

---

## 12. Companion Onboarding — Detailed Interaction Notes

### Step 2: Availability
- Weekly grid: Mon–Sun as column headers, time slots (Morning / Afternoon / Evening / Night) as rows
- Tap a cell to toggle available
- Recurrence: "Every week" (default) or "Specific dates" toggle
- Reminder card at bottom: soft yellow bg — "Keep your availability up to date. Companions with stale schedules get fewer bookings."

### Step 3: Service Areas (Mapbox)
- Map initialises centred on user's last known city (from IP geolocation — no GPS prompt)
- Draw tool: click/tap to place center → drag to expand radius → release to confirm
- Circles stored as `{ center: [lng, lat], radiusKm: number, label: string }`
- Each circle: amber fill `rgba(186,117,23,0.15)`, amber stroke `#BA7517`, 2px
- Delete: X button floating on circle
- Edit: tap circle → handle appears on edge to resize
- "Name this area" optional label input per circle (e.g. "Central Mumbai")

### Step 5: Selfie — face-api.js
- Load models: `tiny_face_detector` + `face_landmark_68_net`
- Detection loop: runs every 200ms on video frame
- Valid detection criteria: face confidence > 0.8, face fills > 30% of frame, no pitch/yaw > 20deg
- Auto-capture after 2000ms of continuous valid detection
- On capture: upload to server as JPEG, max 2MB, strip EXIF

### Step 6: ID Capture
- Two captures: front then back, sequential
- Instruction overlay: animated guides (align card to frame)
- No face validation required (it's a document)
- Allow retake up to 3 times per side
- Upload both as separate files with `type: 'id_front'` / `type: 'id_back'`

---

*End of DESIGN.md — Meytle v1.0 · May 2026*
