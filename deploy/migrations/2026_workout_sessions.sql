-- Migration: workout_sessions
-- Logged workouts from the athlete workout tracker.
-- Safe to run on an existing database (idempotent).

CREATE TABLE IF NOT EXISTS workout_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date            timestamptz NOT NULL DEFAULT now(),
  title           text,
  duration_sec    integer NOT NULL DEFAULT 0,
  total_volume_lb numeric NOT NULL DEFAULT 0,
  pr_count        integer NOT NULL DEFAULT 0,
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,  -- full session: {durationSec,totalVolumeLb,prs[],exercises[]}
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_sessions_client_idx ON workout_sessions (client_id, date DESC);
