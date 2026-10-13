-- D1 migration: patron signup storage for dvaughnhouse.com/patron
-- Apply once: wrangler d1 execute dvaughnhouse-contacts --file migrations/0002_patrons.sql
-- (or paste into the D1 console in the Cloudflare dashboard)
-- Note: reuses the rate_limits table from 0001_contacts.sql.

CREATE TABLE IF NOT EXISTS patrons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('insider', 'patron', 'founding')),
  message TEXT NOT NULL DEFAULT '',
  ip TEXT,
  user_agent TEXT,
  followed_up INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_patrons_created ON patrons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patrons_tier ON patrons(tier);
