const db = require('../config/database');

// Insert one notification per target student (all active students when no ids given).
// Never throws: a failed notification must not fail the admin action that triggered it.
const { emitTo } = require('./events');

const notifyStudents = (title, message, studentIds = null) =>
  new Promise((resolve) => {
    const insert = (ids) => {
      const stmt = db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)');
      ids.forEach((id) => stmt.run(id, title, message));
      stmt.finalize(() => {
        emitTo(ids, { type: 'notification' });
        resolve();
      });
    };
    if (studentIds) return insert([].concat(studentIds));
    db.all("SELECT id FROM users WHERE role = 'student' AND is_active = 1 AND deleted_at IS NULL", (err, rows) => {
      if (err) return resolve();
      insert(rows.map((r) => r.id));
    });
  });

const LOW_ATTENDANCE_BELOW = 75; // percent
const LOW_ATTENDANCE_MIN_LECTURES = 3; // do not warn on the first lectures

// Tells a student when their attendance in one class drops below the threshold.
// At most one warning per class per day, so repeated saves do not spam them.
const notifyLowAttendance = (studentId, courseId) =>
  new Promise((resolve) => {
    db.get(
      'SELECT classes_held AS held, classes_attended AS attended FROM attendance WHERE student_id = ? AND course_id = ?',
      [studentId, courseId],
      (err, row) => {
        if (err || !row || row.held < LOW_ATTENDANCE_MIN_LECTURES) return resolve(false);
        const pct = Math.round((row.attended * 1000) / row.held) / 10;
        if (pct >= LOW_ATTENDANCE_BELOW) return resolve(false);
        db.get('SELECT code FROM courses WHERE id = ?', [courseId], (e2, course) => {
          const code = course?.code || `course ${courseId}`;
          db.get(
            `SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Low attendance'
               AND message LIKE ? AND date(created_at, 'localtime') = date('now', 'localtime')`,
            [studentId, `%${code}%`],
            (e3, dup) => {
              if (dup) return resolve(false);
              db.run(
                'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
                [studentId, 'Low attendance', `Your attendance in ${code} is ${pct}% (below ${LOW_ATTENDANCE_BELOW}%). Please attend the next lectures.`],
                (e4) => {
                  if (!e4) emitTo(studentId, { type: 'notification' });
                  resolve(!e4);
                }
              );
            }
          );
        });
      }
    );
  });

module.exports = { notifyStudents, notifyLowAttendance, LOW_ATTENDANCE_BELOW };
