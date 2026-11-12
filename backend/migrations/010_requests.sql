-- Student requests to the administration: one thread per request.
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('approval', 'question', 'document', 'complaint')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_notified_at DATETIME,
  student_read_msg_id INTEGER DEFAULT 0,
  admin_read_msg_id INTEGER DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id, status);

CREATE TABLE IF NOT EXISTS request_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),
  kind TEXT NOT NULL DEFAULT 'message' CHECK (kind IN ('message', 'status')),
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_request_messages_thread ON request_messages(request_id, id);
