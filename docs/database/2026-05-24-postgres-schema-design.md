# Meytle — PostgreSQL 16 Schema Design

> Created: 2026-05-24
> Approach: Fully normalised (Approach B)
> Extensions required: `postgis`, `pgcrypto` (for `gen_random_uuid()`)

---

## Design decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Geographic storage | `GEOGRAPHY(POINT, 4326)` via PostGIS | Native `ST_DWithin` radius checks, draw-tool polygon filtering, correct spherical distance in metres |
| Monetary amounts | `INTEGER` paisa | Exact integers, no float rounding, matches Stripe's smallest-unit API |
| Role model | `user_role[]` array on `users` | One account can hold any combination of `user`, `companion`, `admin` |
| Rating cache | Denormalised `rating_avg` + `rating_count` on `companion_profiles` | Avoids aggregate scan on every feed page load; kept consistent via trigger |
| Message IDs | `BIGSERIAL` | Highest-insert table; sequential IDs keep B-tree inserts tight and give natural ordering |
| Notification IDs | `BIGSERIAL` | Same reasoning as messages |
| JSONB usage | Only `stripe_webhook_events.payload` | Stripe payloads are opaque blobs needed verbatim for replay; everything else is typed columns |
| OTP storage | `CHAR(6)` plain text | Session-scoped one-time code, not a password; meaningless once `otp_verified_at` is set |

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## Shared trigger — updated_at

Applied to every table with an `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

---

## Section 1 — Users & Auth

```sql
CREATE TYPE user_role AS ENUM ('user', 'companion', 'admin');

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    full_name     TEXT        NOT NULL,
    roles         user_role[] NOT NULL DEFAULT ARRAY['user']::user_role[],
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email        UNIQUE (lower(email)),
    CONSTRAINT check_roles_not_empty CHECK (array_length(roles, 1) > 0)
);

CREATE UNIQUE INDEX idx_users_email ON users (lower(email));
CREATE        INDEX idx_users_roles  ON users USING GIN (roles);

CREATE TRIGGER trg_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Notes:**
- `lower(email)` unique index prevents `Bob@gmail.com` vs `bob@gmail.com` duplicates.
- GIN index on `roles` makes `WHERE 'companion' = ANY(roles)` fast.
- Refresh token strategy is TBD in spec; add a `refresh_tokens` table when resolved.

---

## Section 2 — Companion Profiles

```sql
CREATE TYPE companion_status AS ENUM (
    'pending_verification', 'active', 'inactive', 'rejected'
);

CREATE TYPE service_type AS ENUM (
    'coffee', 'dining', 'concert', 'travel', 'fitness',
    'culture', 'nature', 'movies', 'shopping', 'gaming'
);

CREATE TABLE companion_profiles (
    id                          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID             NOT NULL,
    display_name                TEXT             NOT NULL,
    bio                         TEXT             CHECK (char_length(bio) <= 300),
    date_of_birth               DATE             NOT NULL,
    profile_photo_url           TEXT             NOT NULL,
    hourly_rate_paisa           INTEGER          NOT NULL CHECK (hourly_rate_paisa >= 50000),
    profile_status              companion_status NOT NULL DEFAULT 'pending_verification',
    is_available_now            BOOLEAN          NOT NULL DEFAULT FALSE,
    service_area_centre         GEOGRAPHY(POINT, 4326) NOT NULL,
    service_area_radius_km      DECIMAL(4,1)     NOT NULL CHECK (service_area_radius_km BETWEEN 1 AND 30),
    stripe_connected_account_id TEXT,
    stripe_payouts_enabled      BOOLEAN          NOT NULL DEFAULT FALSE,
    rating_avg                  DECIMAL(3,1),
    rating_count                INTEGER          NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cp_user_id        UNIQUE (user_id),
    CONSTRAINT uq_cp_stripe_account UNIQUE (stripe_connected_account_id),
    CONSTRAINT fk_cp_user           FOREIGN KEY (user_id)
                                    REFERENCES users(id) ON DELETE CASCADE
);

-- Feed: filter active + sort by availability then rating
CREATE INDEX idx_cp_status_available ON companion_profiles (profile_status, is_available_now);
-- Feed: ORDER BY rating_avg DESC — partial index skips inactive profiles
CREATE INDEX idx_cp_rating           ON companion_profiles (rating_avg DESC NULLS LAST)
                                         WHERE profile_status = 'active';
-- Map view + radius check (ST_DWithin)
CREATE INDEX idx_cp_geo              ON companion_profiles USING GIST (service_area_centre);

CREATE TRIGGER trg_updated_at_companion_profiles
BEFORE UPDATE ON companion_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

```sql
-- One row per service a companion offers (max 10 rows per companion)
CREATE TABLE companion_services (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID         NOT NULL,
    service_type service_type NOT NULL,

    CONSTRAINT uq_cs           UNIQUE (companion_id, service_type),
    CONSTRAINT fk_cs_companion FOREIGN KEY (companion_id)
                               REFERENCES companion_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_cs_companion_id ON companion_services (companion_id);
CREATE INDEX idx_cs_service_type ON companion_services (service_type);
```

```sql
-- One row per available day (max 7 rows per companion)
CREATE TABLE companion_availability (
    id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID     NOT NULL,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Mon, 6 = Sun
    from_time    TIME     NOT NULL,
    to_time      TIME     NOT NULL,

    CONSTRAINT uq_ca           UNIQUE (companion_id, day_of_week),
    CONSTRAINT check_ca_times  CHECK (to_time > from_time),
    CONSTRAINT fk_ca_companion FOREIGN KEY (companion_id)
                               REFERENCES companion_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_ca_companion_id ON companion_availability (companion_id);
```

---

## Section 3 — Identity Verification

```sql
CREATE TYPE verification_tier   AS ENUM ('stripe_identity', 'veriff', 'manual');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'needs_resubmission', 'failed');

CREATE TABLE identity_verifications (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id        UUID                NOT NULL,
    tier                verification_tier   NOT NULL,
    external_session_id TEXT,
    status              verification_status NOT NULL DEFAULT 'pending',
    document_url        TEXT,               -- manual tier only; delete after admin review
    admin_reviewer_id   UUID,               -- set only for manual tier
    admin_notes         TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_iv_companion FOREIGN KEY (companion_id)
                               REFERENCES companion_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_iv_admin     FOREIGN KEY (admin_reviewer_id)
                               REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_iv_companion ON identity_verifications (companion_id);
-- Admin queue: pending manual reviews
CREATE INDEX idx_iv_pending   ON identity_verifications (tier, created_at)
                                   WHERE status = 'pending';

CREATE TRIGGER trg_updated_at_identity_verifications
BEFORE UPDATE ON identity_verifications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Tier fallback order:** `stripe_identity` → `veriff` → `manual`
Each attempt creates a new row; the companion's `profile_status` transitions to `active` on any verified row.

---

## Section 4 — Bookings

```sql
CREATE TYPE booking_status     AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE cancelled_by_party AS ENUM ('user', 'companion', 'admin', 'system');

CREATE TABLE bookings (
    id                       UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID               NOT NULL,
    companion_id             UUID               NOT NULL,
    service_type             service_type       NOT NULL,
    status                   booking_status     NOT NULL DEFAULT 'pending',

    -- Schedule (all UTC)
    booked_start             TIMESTAMPTZ        NOT NULL,
    booked_end               TIMESTAMPTZ        NOT NULL,
    booked_duration_minutes  SMALLINT           NOT NULL CHECK (booked_duration_minutes IN (60, 120, 180, 240)),

    -- Actual session (populated during in_progress / completed)
    actual_start             TIMESTAMPTZ,
    actual_end               TIMESTAMPTZ,
    auto_completed           BOOLEAN            NOT NULL DEFAULT FALSE,

    -- Meeting spot
    meeting_spot             GEOGRAPHY(POINT, 4326) NOT NULL,
    meeting_spot_text        TEXT               NOT NULL,

    -- Custom request
    is_custom_request        BOOLEAN            NOT NULL DEFAULT FALSE,
    custom_note              TEXT,

    -- OTP (generated server-side on transition to confirmed)
    otp_code                 CHAR(6),
    otp_verified_at          TIMESTAMPTZ,

    -- Payment (all paisa)
    amount_paisa             INTEGER            NOT NULL CHECK (amount_paisa > 0),
    platform_fee_paisa       INTEGER,           -- NULL until completed
    companion_payout_paisa   INTEGER,           -- NULL until completed
    stripe_payment_intent_id TEXT,

    -- Cancellation
    cancelled_by             cancelled_by_party,
    cancellation_reason      TEXT,
    cancelled_at             TIMESTAMPTZ,

    created_at               TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bk_user        FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_bk_companion   FOREIGN KEY (companion_id) REFERENCES companion_profiles(id),
    CONSTRAINT uq_bk_stripe_pi   UNIQUE (stripe_payment_intent_id),
    CONSTRAINT check_bk_end      CHECK (booked_end > booked_start),
    CONSTRAINT check_actual_end  CHECK (actual_end IS NULL OR actual_end >= actual_start),
    CONSTRAINT check_cancel_pair CHECK ((cancelled_by IS NULL) = (cancelled_at IS NULL))
);

-- User "My Bookings" tabs (upcoming / past)
CREATE INDEX idx_bk_user_status      ON bookings (user_id, status);
-- Companion dashboard pending + confirmed lists
CREATE INDEX idx_bk_companion_status ON bookings (companion_id, status);
-- Scheduled job: auto-expire pending bookings older than 24 h
CREATE INDEX idx_bk_auto_expire      ON bookings (created_at)  WHERE status = 'pending';
-- Scheduled job: auto-complete in_progress bookings past booked_end
CREATE INDEX idx_bk_auto_complete    ON bookings (booked_end)  WHERE status = 'in_progress';
-- Messaging access-window check (confirmed bookings by time range)
CREATE INDEX idx_bk_time_window      ON bookings (booked_start, booked_end) WHERE status = 'confirmed';
-- Stripe webhook lookup
CREATE INDEX idx_bk_stripe_pi        ON bookings (stripe_payment_intent_id);

CREATE TRIGGER trg_updated_at_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Status transitions:**
```
pending
  │  Companion accepts               → confirmed
  │  Companion declines / 24h expire → cancelled (cancelled_by = 'companion' or 'system')
  │  User cancels                    → cancelled (cancelled_by = 'user')
confirmed
  │  OTP verified                    → in_progress  (actual_start logged)
  │  Admin cancels                   → cancelled (cancelled_by = 'admin')
in_progress
  │  Companion ends / auto-complete  → completed    (actual_end logged)
completed   — terminal
cancelled   — terminal
```

**Meeting spot vs service area radius check** (used on booking step 3 to show soft warning):
```sql
SELECT ST_DWithin(
    $meeting_spot::geography,
    cp.service_area_centre::geography,
    cp.service_area_radius_km * 1000
) AS within_area
FROM companion_profiles cp
WHERE cp.id = $companion_id;
```

---

## Section 5 — Payments

### Tip payments (custom request tip — separate Payment Intent)

```sql
CREATE TYPE tip_status AS ENUM ('pending', 'captured', 'transferred', 'refunded');

CREATE TABLE tip_payments (
    id                       UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id               UUID       NOT NULL,
    amount_paisa             INTEGER    NOT NULL CHECK (amount_paisa >= 10000), -- min ₹100
    stripe_payment_intent_id TEXT       NOT NULL,
    status                   tip_status NOT NULL DEFAULT 'pending',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tp_booking   UNIQUE (booking_id),
    CONSTRAINT uq_tp_stripe_pi UNIQUE (stripe_payment_intent_id),
    CONSTRAINT fk_tp_booking   FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TRIGGER trg_updated_at_tip_payments
BEFORE UPDATE ON tip_payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Payouts (one per completed booking)

```sql
CREATE TABLE payouts (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id       UUID        NOT NULL,
    booking_id         UUID        NOT NULL,
    stripe_transfer_id TEXT        NOT NULL,
    amount_paisa       INTEGER     NOT NULL CHECK (amount_paisa > 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payouts_booking  UNIQUE (booking_id),
    CONSTRAINT uq_payouts_transfer UNIQUE (stripe_transfer_id),
    CONSTRAINT fk_payouts_companion FOREIGN KEY (companion_id)
                                    REFERENCES companion_profiles(id),
    CONSTRAINT fk_payouts_booking  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Companion dashboard: earnings this month, payout history
CREATE INDEX idx_payouts_companion ON payouts (companion_id, created_at DESC);
```

### Stripe webhook event log (idempotency)

```sql
CREATE TABLE stripe_webhook_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT        NOT NULL,
    event_type      TEXT        NOT NULL,
    payload         JSONB       NOT NULL,   -- only JSONB field in the schema
    processed       BOOLEAN     NOT NULL DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_stripe_event_id UNIQUE (stripe_event_id)
);

CREATE INDEX idx_stripe_unprocessed ON stripe_webhook_events (created_at)
    WHERE processed = FALSE;
```

**Events to handle:**

| Stripe event | Action |
|---|---|
| `payment_intent.payment_failed` | Mark booking failed, notify user |
| `payment_intent.canceled` | Confirm refund processed |
| `transfer.created` | Insert into `payouts` |
| `account.updated` | Update `stripe_payouts_enabled` on companion |
| `identity.verification_session.verified` | Set `profile_status = 'active'` |
| `identity.verification_session.requires_input` | Set verification status to `needs_resubmission` |

---

## Section 6 — Messaging

```sql
-- BIGSERIAL: highest-insert table; sequential IDs keep B-tree inserts efficient
CREATE TABLE messages (
    id         BIGSERIAL   PRIMARY KEY,
    booking_id UUID        NOT NULL,
    sender_id  UUID        NOT NULL,
    content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
    is_blocked BOOLEAN     NOT NULL DEFAULT FALSE,  -- set TRUE when phone-pattern matched
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_msg_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_msg_sender  FOREIGN KEY (sender_id)  REFERENCES users(id)
);

CREATE INDEX idx_msg_thread ON messages (booking_id, sent_at);
CREATE INDEX idx_msg_sender ON messages (sender_id);
```

```sql
-- Cursor-based unread tracking: unread = sent_at > last_read_at for this user+thread
-- UPSERT on thread open; no per-message write
CREATE TABLE message_reads (
    user_id      UUID        NOT NULL,
    booking_id   UUID        NOT NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, booking_id),
    CONSTRAINT fk_mr_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mr_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

**Unread badge count query:**
```sql
SELECT COUNT(*)
FROM   messages m
LEFT   JOIN message_reads mr
       ON  mr.booking_id = m.booking_id
       AND mr.user_id    = $user_id
WHERE  m.booking_id = ANY($open_booking_ids)   -- pre-fetched for this user
AND    m.sender_id  != $user_id
AND    m.is_blocked  = FALSE
AND    (mr.last_read_at IS NULL OR m.sent_at > mr.last_read_at);
```

**Message list page query** (threads within access window + last 24 h post-close):
```sql
SELECT
    b.id                                AS booking_id,
    last_msg.content                    AS last_message_preview,
    last_msg.sent_at                    AS last_message_at,
    COUNT(*) FILTER (
        WHERE m.sender_id != $user_id
        AND   m.is_blocked = FALSE
        AND   (mr.last_read_at IS NULL OR m.sent_at > mr.last_read_at)
    )                                   AS unread_count
FROM bookings b
JOIN LATERAL (
    SELECT content, sent_at
    FROM   messages
    WHERE  booking_id = b.id
    ORDER  BY sent_at DESC
    LIMIT  1
) last_msg ON TRUE
LEFT JOIN messages m    ON  m.booking_id = b.id
LEFT JOIN message_reads mr ON mr.booking_id = b.id AND mr.user_id = $user_id
WHERE (b.user_id = $user_id
   OR  b.companion_id IN (
           SELECT id FROM companion_profiles WHERE user_id = $user_id
       ))
AND   b.status = 'confirmed'
AND   NOW() BETWEEN (b.booked_start - INTERVAL '3 hours')
                AND (b.booked_end   + INTERVAL '26 hours')  -- 2h grace + 24h archive window
GROUP BY b.id, last_msg.content, last_msg.sent_at
ORDER BY last_msg.sent_at DESC;
```

---

## Section 7 — Reviews

```sql
CREATE TABLE reviews (
    id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID     NOT NULL,
    reviewer_id  UUID     NOT NULL,
    companion_id UUID     NOT NULL,    -- denormalised for profile-page query
    star_rating  SMALLINT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
    comment      TEXT     CHECK (char_length(comment) <= 300),
    is_removed   BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reviews_booking  UNIQUE (booking_id),
    CONSTRAINT fk_rv_booking       FOREIGN KEY (booking_id)   REFERENCES bookings(id),
    CONSTRAINT fk_rv_reviewer      FOREIGN KEY (reviewer_id)  REFERENCES users(id),
    CONSTRAINT fk_rv_companion     FOREIGN KEY (companion_id) REFERENCES companion_profiles(id)
);

-- Profile page: latest 10 non-removed reviews
CREATE INDEX idx_rv_companion ON reviews (companion_id, created_at DESC)
    WHERE is_removed = FALSE;
```

**Rating cache trigger** — fires after any insert, update (`is_removed`), or delete:
```sql
CREATE OR REPLACE FUNCTION refresh_companion_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    target_companion_id UUID;
BEGIN
    target_companion_id := COALESCE(NEW.companion_id, OLD.companion_id);

    UPDATE companion_profiles
    SET
        rating_avg   = (
            SELECT ROUND(AVG(star_rating)::NUMERIC, 1)
            FROM   reviews
            WHERE  companion_id = target_companion_id
            AND    is_removed   = FALSE
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM   reviews
            WHERE  companion_id = target_companion_id
            AND    is_removed   = FALSE
        ),
        updated_at   = NOW()
    WHERE id = target_companion_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refresh_rating
AFTER INSERT OR UPDATE OF is_removed OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_companion_rating();
```

**Public rating display rule** (in application layer):
- `rating_count >= 3` → show `rating_avg` stars
- `rating_count < 3`  → show "New"

---

## Section 8 — Notifications

```sql
CREATE TYPE notification_type AS ENUM (
    'booking_request_received',
    'booking_confirmed',
    'booking_declined',
    'booking_expired',
    'booking_cancelled_by_user',
    'booking_cancelled_by_companion',
    'new_message',
    'review_available',
    'chat_window_opening'
);

CREATE TABLE notifications (
    id         BIGSERIAL         PRIMARY KEY,
    user_id    UUID              NOT NULL,
    type       notification_type NOT NULL,
    title      TEXT              NOT NULL,
    body       TEXT              NOT NULL,
    booking_id UUID,
    is_read    BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)
                                REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_booking FOREIGN KEY (booking_id)
                                REFERENCES bookings(id) ON DELETE SET NULL
);

-- Bell dropdown (last 20) + unread badge count
CREATE INDEX idx_notif_user ON notifications (user_id, is_read, created_at DESC);
```

**Unread badge count:**
```sql
SELECT COUNT(*) FROM notifications
WHERE  user_id = $user_id AND is_read = FALSE;
```

**Mark all read:**
```sql
UPDATE notifications SET is_read = TRUE
WHERE  user_id = $user_id AND is_read = FALSE;
```

---

## Section 9 — Session Flow

### Temporary location pings

```sql
CREATE TABLE session_locations (
    id          BIGSERIAL             PRIMARY KEY,
    booking_id  UUID                  NOT NULL,
    party       TEXT                  NOT NULL CHECK (party IN ('user', 'companion')),
    location    GEOGRAPHY(POINT, 4326) NOT NULL,
    recorded_at TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ           NOT NULL,    -- max 48 h from recorded_at

    CONSTRAINT fk_sl_booking FOREIGN KEY (booking_id)
                             REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_sl_booking ON session_locations (booking_id, recorded_at DESC);
-- Cleanup job: DELETE FROM session_locations WHERE expires_at < NOW()
CREATE INDEX idx_sl_expires ON session_locations (expires_at);
```

### No-show disputes

```sql
CREATE TABLE no_show_disputes (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id           UUID        NOT NULL,
    reported_by_user_id  UUID        NOT NULL,
    reported_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    companion_pct        DECIMAL(5,2),
    user_refund_pct      DECIMAL(5,2),
    platform_pct         DECIMAL(5,2),
    resolved_by_admin_id UUID,
    resolved_at          TIMESTAMPTZ,
    admin_notes          TEXT,

    CONSTRAINT uq_nsd_booking     UNIQUE (booking_id),
    CONSTRAINT fk_nsd_booking     FOREIGN KEY (booking_id)
                                  REFERENCES bookings(id),
    CONSTRAINT fk_nsd_reported_by FOREIGN KEY (reported_by_user_id)
                                  REFERENCES users(id),
    CONSTRAINT fk_nsd_admin       FOREIGN KEY (resolved_by_admin_id)
                                  REFERENCES users(id),
    CONSTRAINT check_pcts_sum     CHECK (
        (companion_pct IS NULL AND user_refund_pct IS NULL AND platform_pct IS NULL)
        OR (companion_pct + user_refund_pct + platform_pct = 100.00)
    )
);
```

**Admin payout split defaults (pre-filled, always editable):**

| Scenario | Companion % | User refund % | Platform % |
|---|---|---|---|
| User no-show, companion verified at location | 50 | 40 | 10 |
| Companion no-show, user verified at location | 0 | 100 | 0 |
| Both no-show / unclear | 0 | 90 | 10 |

---

## Section 10 — Platform Config

```sql
CREATE TABLE platform_config (
    key        TEXT        PRIMARY KEY,
    value      TEXT        NOT NULL,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pc_user FOREIGN KEY (updated_by)
                          REFERENCES users(id) ON DELETE SET NULL
);

-- Seed
INSERT INTO platform_config (key, value) VALUES ('platform_fee_percent', '5');
```

Application read pattern:
```sql
SELECT value FROM platform_config WHERE key = 'platform_fee_percent';
-- Falls back to PLATFORM_FEE_PERCENT env var if no row exists
```

---

## Full table inventory

| Table | PK type | Rows (est. v1) | Notes |
|---|---|---|---|
| `users` | UUID | thousands | Auth identity |
| `companion_profiles` | UUID | hundreds | 1:1 with users for companions |
| `companion_services` | UUID | < 10 per companion | Enum rows |
| `companion_availability` | UUID | ≤ 7 per companion | Day rows |
| `identity_verifications` | UUID | 1–3 per companion | Per-attempt log |
| `bookings` | UUID | tens of thousands | Core transaction table |
| `tip_payments` | UUID | subset of bookings | Custom requests only |
| `payouts` | UUID | = completed bookings | One per booking |
| `stripe_webhook_events` | UUID | high volume | Append-only log |
| `messages` | BIGSERIAL | highest volume | Per-booking thread |
| `message_reads` | composite PK | = 2 × bookings | Cursor per user per thread |
| `reviews` | UUID | subset of bookings | One per booking |
| `notifications` | BIGSERIAL | high volume | Per user, append-only |
| `session_locations` | BIGSERIAL | high volume, short-lived | Deleted after 48 h |
| `no_show_disputes` | UUID | rare | One per disputed booking |
| `platform_config` | TEXT key | < 10 rows | Admin-editable settings |

---

## Entity relationship summary

```
users ──────────────────────────────────── 1:1 ── companion_profiles
  │                                                     │           │
  │                                        companion_services  companion_availability
  │                                                     │
  │ (as customer, via user_id)                          │ (as companion, via companion_id)
  └──────────────────── bookings ──────────────────────┘
                            │
          ┌─────────────────┼──────────────────┬──────────────────┐
          │                 │                  │                  │
       messages          reviews         notifications       tip_payments
          │                                                    payouts
     message_reads                                    stripe_webhook_events

  bookings ──── session_locations
  bookings ──── no_show_disputes
  identity_verifications ──── companion_profiles
```

---

## Key queries reference

### Feed (discovery page)
```sql
SELECT
    cp.id, cp.display_name, cp.profile_photo_url,
    cp.hourly_rate_paisa, cp.rating_avg, cp.rating_count,
    cp.is_available_now,
    array_agg(cs.service_type ORDER BY cs.service_type) AS services
FROM companion_profiles cp
JOIN companion_services cs ON cs.companion_id = cp.id
WHERE cp.profile_status = 'active'
  AND ($service_filter IS NULL OR cs.service_type = $service_filter)
GROUP BY cp.id
ORDER BY cp.is_available_now DESC, cp.rating_avg DESC NULLS LAST
LIMIT 50;
```

### Companion earnings this month
```sql
SELECT COALESCE(SUM(p.amount_paisa), 0) AS earnings_paisa
FROM   payouts p
WHERE  p.companion_id = $companion_id
AND    p.created_at  >= date_trunc('month', NOW())
AND    p.created_at  <  date_trunc('month', NOW()) + INTERVAL '1 month';
```

### Companion response rate (last 90 days)
```sql
SELECT
    COUNT(*) FILTER (WHERE cancelled_by IN ('companion','user','system')
                       OR  status IN ('confirmed','in_progress','completed')) AS responded,
    COUNT(*)                                                                   AS total,
    ROUND(
        100.0 * COUNT(*) FILTER (
            WHERE cancelled_by IN ('companion','user','system')
               OR status IN ('confirmed','in_progress','completed')
        ) / NULLIF(COUNT(*), 0),
        1
    ) AS response_rate_pct
FROM  bookings
WHERE companion_id = $companion_id
AND   created_at  >= NOW() - INTERVAL '90 days';
```

### Earnings bar chart (last 7 days)
```sql
SELECT
    d.day::DATE                                AS day,
    COALESCE(SUM(p.amount_paisa), 0)           AS earnings_paisa
FROM   generate_series(
           NOW()::DATE - 6, NOW()::DATE, '1 day'
       ) AS d(day)
LEFT   JOIN payouts p
       ON  p.companion_id = $companion_id
       AND p.created_at::DATE = d.day
GROUP  BY d.day
ORDER  BY d.day;
```
