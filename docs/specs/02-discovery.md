# 02 — Companion Discovery

> `FE` 🟡 UI only (mock data) · `BE` 🔲 Not started

---

## Feed (Home Page)

**Who:** Logged-in users.

**What they see:** A grid of companion cards for their city.

**Each card shows:**
- Photo
- Name, age, neighbourhood
- Top 2 services
- Star rating + review count
- Price from (per hour)
- Online/available indicator (green dot)

**Default sort:** Available now first, then by rating descending.

**Rules:**
- Only show companions with `isVerified = true` and `profileActive = true`
- If no companions found: show empty state with "No companions in your area yet"

---

## Search

- Search bar filters by companion name
- Filtering happens client-side once the city's companion list is loaded (no per-keystroke API call in v1)
- Clears when user taps ✕ or clears the input

---

## Filter Chips

Chips: **All · Coffee · Dining · Concert · Travel · Fitness · Culture · Nature · Movies · Shopping · Gaming**

- Only one chip active at a time
- Selecting a chip filters the feed to companions who offer that service type
- Combining search + chip: both filters apply at the same time
- Selecting "All" resets to no service filter

---

## Map View

- Shows companion pins on a map centred on the user's city
- Tapping a pin shows the companion name, price, and a "View Profile" link
- Draw tool: user can draw a shape on the map to filter companions within that area
- Only companions with `isAvailableNow = true` shown as solid pins; offline shown as faded

> Map data comes from companion's `serviceAreaCentre` (lat/lng) + `serviceAreaRadiusKm`
