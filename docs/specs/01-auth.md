# 01 — Authentication

> `FE` 🟡 UI only (forms exist, no API calls) · `BE` 🔲 Not started

---

## Register

**Who:** Anyone visiting the site for the first time.

**Fields:**
- Full name
- Email address (must be unique)
- Password (minimum 8 characters)

**Rules:**
- Email must not already exist in the system
- On success: account created with role `user`, JWT issued, user sent to `/app`
- No role selection at signup — becoming a companion is separate (see `08-companion-onboarding`)

**Errors to show:**
- "Email already in use"
- "Password must be at least 8 characters"

---

## Login

**Who:** Returning users.

**Fields:**
- Email
- Password

**Rules:**
- On success: JWT token returned, stored client-side, redirect to `/app` (or original destination if redirected from a protected route)
- On failure: show "Invalid email or password" — do not say which field is wrong
- Token expires in 7 days
- Refresh token strategy: ⚠️ TBD

**Errors to show:**
- "Invalid email or password" (generic — same for both wrong email and wrong password)

---

## Logout

- Clears JWT from client storage
- Redirects to `/`
- Server-side token invalidation: ⚠️ TBD (blacklist or short expiry)

---

## Protected Routes

- All `/app/*` routes require a valid JWT
- If token is missing or expired → redirect to `/login` with the original URL saved
- After login → redirect back to saved URL
- `/companions/:id` is public (no token needed)

> `FE` ✅ Done — `RequireAuth` guard already in place
