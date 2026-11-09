-- One row per student per class date, so saving attendance twice for the same day
-- does not double-count classes.
CREATE TABLE IF NOT EXISTS attendance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  class_date TEXT NOT NULL,
  present INTEGER NOT NULL DEFAULT 0,
  recorded_by INTEGER,
  UNIQUE(student_id, course_id, class_date),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attendance_log_course_date ON attendance_log(course_id, class_date);
