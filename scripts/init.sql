-- ─── Usage Tracker PostgreSQL Schema ───
-- This file runs automatically on first docker-compose start.

CREATE TABLE IF NOT EXISTS focus_events (
  id              SERIAL PRIMARY KEY,
  app_name        TEXT NOT NULL,
  window_title    TEXT DEFAULT '',
  category        TEXT DEFAULT 'other',
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  date            DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_events_date     ON focus_events(date);
CREATE INDEX IF NOT EXISTS idx_focus_events_app      ON focus_events(app_name);
CREATE INDEX IF NOT EXISTS idx_focus_events_category ON focus_events(category);
CREATE INDEX IF NOT EXISTS idx_focus_events_started  ON focus_events(started_at);

CREATE TABLE IF NOT EXISTS user_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
