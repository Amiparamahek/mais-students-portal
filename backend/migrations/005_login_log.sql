-- Every sign-in attempt for a known account, so admins can see how often students use the portal.
CREATE TABLE IF NOT EXISTS login_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  logged_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_login_log_user ON login_log(user_id, logged_in_at);
CREATE INDEX IF NOT EXISTS idx_login_log_time ON login_log(logged_in_at);
