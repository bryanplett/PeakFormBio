-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Self-hosted PostgreSQL schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Admins ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  text NOT NULL UNIQUE,
  password_hash          text,
  name                   text,
  phone                  text,
  status                 text NOT NULL DEFAULT 'active',   -- active | invited

  -- Onboarding / profile fields
  sex                    text,
  date_of_birth          date,
  height_cm              numeric,
  weight_kg              numeric,
  body_fat_pct           numeric,
  units                  text DEFAULT 'imperial',
  goal                   text,
  activity_level         text,
  experience             text,
  days_per_week          integer,
  equipment              text,
  dietary_pref           text,
  allergies              text,
  limitations            text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes                  text,
  pricelist              text DEFAULT 'standard',

  onboarded_at           timestamptz,
  profile_updated_at     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_email_idx ON clients (email);

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- Legacy single-item columns (kept for compatibility)
  product           text,
  item              text,
  quantity          integer,
  qty               integer,

  -- Multi-item line (JSON array [{label,qty,price,sku}])
  items             jsonb,

  status            text NOT NULL DEFAULT 'Processing',
  payment_status    text,
  payment_method    text,
  shipping_method   text,
  shipping_address  text,
  shipping_cost     numeric(10,2),
  phone_at_order    text,
  coupon_code       text,
  inventory_applied boolean DEFAULT false,
  notes             text,

  ordered_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_client_idx ON orders (client_id);

-- ─── Nutrition Plans ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content       jsonb NOT NULL DEFAULT '{}'::jsonb,
  active        boolean NOT NULL DEFAULT true,
  meal_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_plans_client_idx ON nutrition_plans (client_id);

-- ─── Workout Plans ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content    jsonb NOT NULL DEFAULT '{}'::jsonb,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_plans_client_idx ON workout_plans (client_id);

-- ─── Exercises ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text,
  muscle_groups text[],
  equipment     text,
  instructions  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Ingredients ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Plan Templates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL,   -- 'nutrition' | 'workout'
  name       text NOT NULL,
  content    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Recipes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  meal_types   text[] NOT NULL DEFAULT '{}',
  calories     numeric DEFAULT 0,
  protein      numeric DEFAULT 0,
  carbs        numeric DEFAULT 0,
  fat          numeric DEFAULT 0,
  prep_minutes integer DEFAULT 0,
  dietary_tags text[] NOT NULL DEFAULT '{}',
  photo_url    text DEFAULT '',
  ingredients  jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recipes_meal_types_idx   ON recipes USING gin (meal_types);
CREATE INDEX IF NOT EXISTS recipes_dietary_tags_idx ON recipes USING gin (dietary_tags);

CREATE OR REPLACE FUNCTION recipes_touch_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipes_touch ON recipes;
CREATE TRIGGER trg_recipes_touch
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION recipes_touch_updated_at();

-- ─── Weigh-ins ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weigh_ins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  weight_lb  numeric,
  weight_kg  numeric,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weigh_ins_client_idx ON weigh_ins (client_id);

-- ─── Weight Goals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  target_weight numeric,
  target_date   date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Coupons ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  kind       text NOT NULL DEFAULT 'percent',   -- 'percent' | 'fixed'
  amount     numeric NOT NULL DEFAULT 0,
  scope      text NOT NULL DEFAULT 'all',       -- 'all' | 'retatrutide'
  active     boolean NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Inventory ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL UNIQUE,
  stock        integer NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── Bloodwork Files ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bloodwork_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  filename     text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by  uuid,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bloodwork_client_idx ON bloodwork_files (client_id);

-- ─── Client Notifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind       text NOT NULL,
  message    text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_client_idx ON client_notifications (client_id);

-- ─── Age Attestations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS age_attestations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid,
  attested_at timestamptz NOT NULL DEFAULT now(),
  user_agent  text
);
