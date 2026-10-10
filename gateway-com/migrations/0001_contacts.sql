-- D1 migration: contact form storage for dvaughnhouse.com
-- Apply once: wrangler d1 execute dvaughnhouse-contacts --file migrations/0001_contacts.sql
-- (or paste into the D1 console in the Cloudflare dashboard)

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
