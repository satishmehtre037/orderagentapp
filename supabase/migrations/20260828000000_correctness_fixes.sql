-- ============================================================================
-- Correctness & compliance fixes
--
-- 1. businesses.category CHECK expanded to the full BusinessCategory union
--    (was: bakery/salon/tuition/gym/cafe/other — which silently forced every
--     clinic/hospital/ca_firm/retail/real_estate signup down a 23514 retry
--     into category 'bakery')
-- 2. 30-day trial restored as the DB default
-- 3. lead_hunter_leads: real sourced leads with an explicit consent gate
-- 4. opt_outs: STOP/unsubscribe registry, enforced before every outbound send
-- 5. campaigns + campaign_targets: durable campaign state (was in-memory only,
--    so a cold start silently forgot the queue mid-run)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 + 2. businesses: category constraint + trial length
-- ---------------------------------------------------------------------------
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_category_check;

ALTER TABLE businesses
  ADD CONSTRAINT businesses_category_check CHECK (
    category IN (
      'bakery',
      'cafe',
      'salon',
      'gym',
      'tuition',
      'clinic',
      'hospital',
      'retail',
      'real_estate',
      'ca_firm',
      'custom',
      -- kept so pre-existing rows still validate
      'other'
    )
  );

ALTER TABLE businesses
  ALTER COLUMN trial_end_date SET DEFAULT (now() + INTERVAL '30 days');

-- Tenant lookup is by whatsapp_number on every inbound message; it must be
-- unique or the resolver cannot safely pick a single tenant.
CREATE UNIQUE INDEX IF NOT EXISTS businesses_whatsapp_number_key
  ON businesses (whatsapp_number)
  WHERE whatsapp_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversations_business_customer_idx
  ON conversations (business_id, customer_number, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. lead_hunter_leads — real, sourced, consent-gated prospect records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_hunter_leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID REFERENCES businesses(id) ON DELETE SET NULL,

  business_name     TEXT NOT NULL,
  category          TEXT,
  city              TEXT,
  phone_number      TEXT NOT NULL,
  address           TEXT,
  rating            NUMERIC(2, 1),
  reviews_count     INTEGER,
  has_website       BOOLEAN DEFAULT FALSE,
  website           TEXT,
  maps_url          TEXT,

  -- Provenance. 'manual' = pasted/typed by an operator who vouches for it.
  -- Nothing may be dispatched to a lead whose source is not recorded.
  source            TEXT NOT NULL DEFAULT 'google_places'
                    CHECK (source IN ('google_places', 'manual', 'licensed_import', 'inbound')),
  source_ref        TEXT,

  -- Outreach gate. Only 'opt_in' and 'legitimate_b2b' may be messaged.
  consent_status    TEXT NOT NULL DEFAULT 'none'
                    CHECK (consent_status IN ('none', 'opt_in', 'legitimate_b2b', 'opted_out')),
  consent_note      TEXT,
  consent_recorded_at TIMESTAMPTZ,

  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'replied', 'converted', 'opted_out', 'failed')),
  pitch_type        TEXT,
  first_contacted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  contact_attempts  INTEGER NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_hunter_leads_phone_key
  ON lead_hunter_leads (phone_number);

CREATE INDEX IF NOT EXISTS lead_hunter_leads_status_idx
  ON lead_hunter_leads (status, consent_status);

-- ---------------------------------------------------------------------------
-- 4. opt_outs — STOP / unsubscribe registry (checked before EVERY send)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opt_outs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- digits only, no '+', so lookups are canonical
  phone_digits  TEXT NOT NULL,
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  reason        TEXT,
  source_text   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS opt_outs_phone_key ON opt_outs (phone_digits);

-- ---------------------------------------------------------------------------
-- 5. campaigns + campaign_targets — durable outbound campaign state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,

  status        TEXT NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  pitch_type    TEXT NOT NULL DEFAULT 'all_in_one',
  sender_name   TEXT NOT NULL DEFAULT 'WebCore Studios',
  custom_message TEXT,

  delay_seconds INTEGER NOT NULL DEFAULT 35 CHECK (delay_seconds >= 10),
  total         INTEGER NOT NULL DEFAULT 0,
  current_index INTEGER NOT NULL DEFAULT 0,

  -- Durable pacing: the worker only sends once now() >= next_send_at, so a
  -- cold start resumes the queue without double-sending or losing the delay.
  next_send_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  logs          JSONB NOT NULL DEFAULT '[]'::jsonb,

  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns (status, next_send_at);

CREATE TABLE IF NOT EXISTS campaign_targets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id       UUID REFERENCES lead_hunter_leads(id) ON DELETE SET NULL,

  position      INTEGER NOT NULL,
  business_name TEXT NOT NULL,
  phone_number  TEXT NOT NULL,
  category      TEXT,
  city          TEXT,

  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed', 'skipped_opt_out', 'skipped_no_consent')),
  error         TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_targets_pending_idx
  ON campaign_targets (campaign_id, status, position);

-- ---------------------------------------------------------------------------
-- 6. CA invoices: tenant scoping for the Fee Recovery cron
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS invoices_business_status_idx
  ON invoices (business_id, status);

-- ---------------------------------------------------------------------------
-- RLS: service_role only (these are all server-side tables)
-- ---------------------------------------------------------------------------
ALTER TABLE lead_hunter_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_outs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON lead_hunter_leads;
CREATE POLICY "service_role_all" ON lead_hunter_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON opt_outs;
CREATE POLICY "service_role_all" ON opt_outs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON campaigns;
CREATE POLICY "service_role_all" ON campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON campaign_targets;
CREATE POLICY "service_role_all" ON campaign_targets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
