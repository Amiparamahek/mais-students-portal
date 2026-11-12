-- One row per timetable slot per date, written once the class window has closed.
-- Students who did not check in by then are recorded as absent automatically.
CREATE TABLE IF NOT EXISTS class_sessions (
  timetable_id INTEGER NOT NULL,
  class_date TEXT NOT NULL,
  finalized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (timetable_id, class_date),
  FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
);
