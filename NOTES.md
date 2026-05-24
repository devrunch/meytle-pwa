# Meytle — Dev Notes

> Last updated: 2026-05-24

---

## 0. Project Structure

```
meytle-pwa/                  ← repo root
├── frontend/                ← Vite + React PWA
│   ├── src/
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                 ← NestJS + TypeORM + PostgreSQL
│   ├── src/
│   │   ├── auth/            ← JWT auth (fill after spec)
│   │   ├── users/           ← user entity + CRUD
│   │   ├── companions/      ← companion profiles
│   │   ├── bookings/        ← booking flow
│   │   ├── messages/        ← in-booking chat
│   │   ├── reviews/         ← post-booking reviews
│   │   └── common/          ← guards, decorators, filters
│   ├── .env.example
│   └── package.json
│
├── shared/
│   └── types/index.ts       ← types imported by both frontend + backend
│
├── package.json             ← npm workspaces root
└── NOTES.md
```

### Dev commands (from repo root)
```bash
npm run dev:frontend     # Vite dev server → localhost:5173
npm run dev:backend      # NestJS watch → localhost:3000/api
```

### Backend stack
- **NestJS 11** — framework
- **TypeORM** — ORM (entities auto-sync in dev, migrations in prod)
- **PostgreSQL** — primary database
- **@nestjs/jwt + passport-jwt** — auth (fill after spec)
- **class-validator / class-transformer** — DTO validation (global pipe on)

### Adding a new backend module (pattern)
```
src/feature/
  feature.module.ts
  feature.controller.ts   ← routes
  feature.service.ts      ← business logic
  feature.entity.ts       ← TypeORM entity
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
```

---

## 1. UI / Design

### New color tokens needed
When new brand colors arrive, update **one place only**:
- `src/index.css` — all `--color-*` CSS custom properties
- `vite.config.ts` → `manifest.theme_color` + `background_color`
- `index.html` → `<meta name="theme-color">`
- `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — regenerate with `node scripts/gen-icons.mjs` after updating the RGB values in that file

### Inline magic numbers to consolidate
Almost every page uses raw Tailwind values like `text-[13px]`, `rounded-[16px]`, `px-4 md:px-6 lg:px-10`.
These should become design tokens in `tailwind.config.ts` (e.g. `text-body`, `rounded-card`, `px-page`) so one change propagates everywhere.

---

## 2. Known Bugs

### Critical
| # | File | Line | Bug |
|---|------|------|-----|
| B1 | `src/pages/booking/BookingFlow.tsx` | 382–385 | `useMemo` for `preselectedService` has **empty deps array `[]`** — it captures stale `searchParams` and `companion` on mount. Should be `[searchParams, companion]`. This means pre-selecting a service from URL params will silently break after a hot-reload or navigation. |
| B2 | `src/layouts/AppLayout.tsx` | 96–98, 109–110 | User name, email and avatar initial are **hardcoded** (`"You"`, `"you@example.com"`, `"Y"`). Needs to read from `useAuthStore`. |
| B3 | `src/layouts/AppLayout.tsx` | 131 | Logout just calls `navigate('/login')` — **does not call `useAuthStore().logout()`**, so the token is never cleared. User stays "authenticated". |
| B4 | `src/pages/booking/BookingFlow.tsx` | 394 | `locationCoords` state is set but **never used in the booking submission** — map pin selection has no effect on what gets saved. |
| B5 | `src/pages/booking/BookingFlow.tsx` | 385 | `useMemo` deps warning — `searchParams` and `companion` are used inside but not listed. Will cause `react-hooks/exhaustive-deps` lint errors once ESLint is added. |
| B6 | `src/layouts/AppLayout.tsx` | 72–74 | Unread message count is **hardcoded as `2`**. No data source. |

### Medium
| # | File | Line | Bug |
|---|------|------|-----|
| B7 | `src/pages/booking/BookingFlow.tsx` | 21–25 | `MOCK_SCHEDULE` is hardcoded inside the file — the companion's actual availability schedule from `Companion` type is **never used**. Every companion appears available Mon–Sat 8am–9pm. |
| B8 | `src/pages/app/BookingsPage.tsx` | 26–83 | `MOCK_BOOKINGS` is defined **inside** the page file. It should live in `src/data/mockBookings.ts` alongside the companion's mock data. |
| B9 | `src/pages/app/BookingsPage.tsx` | 9–24 | `Booking` interface and `BookingStatus` type are **defined inline** in the page. They belong in `src/types/index.ts`. |
| B10 | `src/layouts/AppLayout.tsx` + `src/components/ui/BottomNav.tsx` | 19–24 / 5–11 | `NAV_ITEMS` array is **defined twice** — once in AppLayout, once in BottomNav. Single source of truth should be in `src/config/nav.ts`. |
| B11 | `src/layouts/AppLayout.tsx` | 62 | Desktop nav items use `<button onClick={() => navigate(...)}>` — **not `<Link>`**. This breaks right-click → open in new tab, middle-click, and browser history semantics. Same issue in `PublicLayout.tsx:28–29`. |

---

## 3. Code Quality / Architecture

### Logic not separated from UI
Pages contain raw business logic inline. Each page should have a matching hook:

| Page | Hook to extract | What it does |
|------|----------------|--------------|
| `HomePage.tsx` | `useCompanionSearch` | filter + search logic (lines 22–26) |
| `BookingsPage.tsx` | `useBookings` | booking split into upcoming/past + totals |
| `BookingFlow.tsx` | `useBookingFlow` | step state, canProceed, slot generation, total calc |
| `AppLayout.tsx` | `useActiveTab` | pathname → NavTab mapping |

### Sub-components buried in page files
These should be moved to `src/components/ui/`:

| Component | Currently in | Move to |
|-----------|-------------|---------|
| `BookingCard` | `BookingsPage.tsx:92` | `src/components/ui/BookingCard.tsx` |
| `MiniCalendar` | `BookingFlow.tsx:52` | `src/components/ui/Calendar.tsx` |
| `CustomBookingPanel` | `BookingFlow.tsx:181` | `src/components/ui/CustomBookingPanel.tsx` |
| `CompanionSidebar` | `BookingFlow.tsx:277` | `src/components/ui/BookingFlowSidebar.tsx` |
| `SwipeCard` (tinder-style) | `CompanionDashboard.tsx:62` | `src/components/ui/SwipeCard.tsx` |

### Button / Link misuse
Use `<Link>` for navigation (not `<button onClick={() => navigate(...)}>`) unless the action has side effects.
Rule of thumb:
- Goes somewhere → `<Link to="...">`
- Does something then goes → `<button onClick={() => { doThing(); navigate(...) }}>`

### Stats strip pattern is duplicated
`BookingsPage.tsx:156–173` and `CompanionDashboard.tsx` both render an identical "stats with icon" grid.
Extract a `<StatsStrip stats={[...]} />` component.

### AppLayout IIFE for activeTab
`AppLayout.tsx:31–38` uses an IIFE `(() => { ... })()` to derive `activeTab`. Should be a plain function or `useMemo`.

### Page padding string repeated 15+ times
`"px-4 md:px-6 lg:px-10"` appears on almost every page. Add to `tailwind.config.ts`:
```js
// tailwind.config.ts
theme: { extend: { spacing: { page: '...' } } }
```
Or create a layout wrapper component `<PageContainer>`.

---

## 4. Backend Plan

### Recommended stack
**Supabase** (fastest path to working backend for this type of app):
- Auth (email/password, social login) — replaces mock login
- PostgreSQL database — companions, bookings, messages, reviews
- Realtime — live message updates, booking status changes
- Row Level Security — users only see their own bookings
- Storage — companion photos

Alternative if you want full control: **Node + Express + PostgreSQL** deployed on Railway or Render.

### Database schema (minimum viable)

```
users          id, email, name, avatar_url, role (user|companion), created_at
companions     id, user_id, bio, city, neighbourhood, price_from, is_verified, is_available_now
services       id, companion_id, type, label
bookings       id, user_id, companion_id, service_id, date, time, duration, location, status, total
messages       id, booking_id, sender_id, body, created_at
reviews        id, booking_id, rating, body, created_at
```

### API endpoints needed (in priority order)

```
POST /auth/login
POST /auth/register
GET  /companions?city=&service=&available=
GET  /companions/:id
POST /bookings
GET  /bookings?userId=
GET  /bookings/:id
PUT  /bookings/:id/status
GET  /messages/:bookingId
POST /messages/:bookingId
```

### Wiring up the existing frontend

The `src/lib/api.ts` Axios instance and `src/store/auth.ts` Zustand store are already set up.
Steps to connect:
1. Replace `LoginPage` form submit with `api.post('/auth/login')` → call `authStore.login(user, token)`
2. Replace `MOCK_COMPANIONS` in `HomePage` with `useEffect(() => api.get('/companions'), [])`
3. Replace `MOCK_BOOKINGS` in `BookingsPage` with `api.get('/bookings')`
4. Add loading + error states (use a `useQuery` wrapper or React Query)

### Recommended: add TanStack Query
```bash
npm install @tanstack/react-query
```
Wrap `main.tsx` with `QueryClientProvider`. Then every data fetch is one line with caching, loading, and error states built in.

---

## 5. Next Session Priorities

### Do immediately (unblocks everything else)
- [ ] Fix B1 — `useMemo` deps in BookingFlow
- [ ] Fix B2 + B3 — Wire AppLayout to `useAuthStore` (user display + real logout)
- [ ] Move `Booking` type + `MOCK_BOOKINGS` out of BookingsPage into `src/types/` and `src/data/`
- [ ] Deduplicate `NAV_ITEMS` into `src/config/nav.ts`

### Do next (code health)
- [ ] Extract `BookingCard`, `MiniCalendar`, `SwipeCard` into `src/components/ui/`
- [ ] Create `useCompanionSearch`, `useBookings` hooks
- [ ] Replace nav `<button>` elements with `<Link>` where appropriate
- [ ] Create `<PageContainer>` wrapper to stop repeating page padding
- [ ] Add ESLint + `eslint-plugin-react-hooks` to catch exhaustive-deps bugs automatically

### When backend is ready
- [ ] Set up Supabase project (or Express server)
- [ ] Replace all `MOCK_*` data with real API calls via `src/lib/api.ts`
- [ ] Add `@tanstack/react-query` for server state management
- [ ] Add loading skeletons (the `PageSkeleton` exists — add card-level ones too)
- [ ] Add form validation (Zod or `react-hook-form` + Zod)

---

## 6. Files Created This Session

| File | Purpose |
|------|---------|
| `src/store/auth.ts` | Zustand auth store (user, token, login, logout) |
| `src/lib/api.ts` | Axios instance with Bearer token + 401 redirect |
| `src/components/ErrorBoundary.tsx` | App-level error boundary |
| `src/components/RequireAuth.tsx` | Route guard — redirects to /login if no token |
| `src/components/PageSkeleton.tsx` | Spinner shown during lazy route loading |
| `scripts/gen-icons.mjs` | Regenerate PWA icons (run after brand color change) |
| `.env.example` | Documents required env vars |
| `public/icon-192.png` | PWA icon (amber placeholder — replace with real logo) |
| `public/icon-512.png` | PWA icon (amber placeholder — replace with real logo) |
| `public/apple-touch-icon.png` | iOS home screen icon |
