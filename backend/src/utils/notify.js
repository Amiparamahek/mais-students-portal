const db = require('../config/database');

// Insert one notification per target student (all active students when no ids given).
// Never throws: a failed notification must not fail the admin action that triggered it.
const notifyStudents = (title, message, studentIds = null) =>
  new Promise((resolve) => {
    const insert = (ids) => {
      const stmt = db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)');
      ids.forEach((id) => stmt.run(id, title, message));
      stmt.finalize(() => resolve());
    };
    if (studentIds) return insert([].concat(studentIds));
    db.all("SELECT id FROM users WHERE role = 'student' AND is_active = 1", (err, rows) => {
      if (err) return resolve();
      insert(rows.map((r) => r.id));
    });
  });

module.exports = { notifyStudents };
