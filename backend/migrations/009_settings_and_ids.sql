-- Student IDs are handed out from this counter and never go back, even after a student is deleted.
CREATE TABLE IF NOT EXISTS student_id_sequence (
  year INTEGER PRIMARY KEY,
  last_no INTEGER NOT NULL
);

-- Server-wide settings set by an admin (feature switches). One row per key.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER
);
