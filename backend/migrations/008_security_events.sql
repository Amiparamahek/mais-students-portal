-- Suspicious activity found by the detection rules. Each event is raised once (dedupe_key),
-- and an admin reviews it. Nothing is blocked automatically except where configured.
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'medium', 'high')),
  user_id INTEGER,
  other_user_id INTEGER,
  timetable_id INTEGER,
  class_date TEXT,
  device_id TEXT,
  ip TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  review_note TEXT,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  dedupe_key TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_events_dedupe ON security_events(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
