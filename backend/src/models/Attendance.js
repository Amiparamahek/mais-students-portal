const db = require('../config/database');

const run = (sql, params) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));
const get = (sql, params) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const all = (sql, params) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const Attendance = {
  // Record a student's attendance for one class date. Saving the same date again changes
  // the result instead of counting the class twice.
  recordClass: async ({ studentId, courseId, classDate, present, recordedBy }) => {
    const flag = present ? 1 : 0;
    const prev = await get(
      'SELECT present FROM attendance_log WHERE student_id = ? AND course_id = ? AND class_date = ?',
      [studentId, courseId, classDate]
    );
    if (!prev) {
      await run(
        `INSERT INTO attendance (student_id, course_id, classes_held, classes_attended) VALUES (?, ?, 1, ?)
         ON CONFLICT(student_id, course_id) DO UPDATE SET
           classes_held = classes_held + 1,
           classes_attended = classes_attended + excluded.classes_attended`,
        [studentId, courseId, flag]
      );
      await run(
        'INSERT INTO attendance_log (student_id, course_id, class_date, present, recorded_by) VALUES (?, ?, ?, ?, ?)',
        [studentId, courseId, classDate, flag, recordedBy]
      );
    } else if (prev.present !== flag) {
      await run(
        'UPDATE attendance SET classes_attended = classes_attended + ? WHERE student_id = ? AND course_id = ?',
        [flag - prev.present, studentId, courseId]
      );
      await run(
        'UPDATE attendance_log SET present = ?, recorded_by = ? WHERE student_id = ? AND course_id = ? AND class_date = ?',
        [flag, recordedBy, studentId, courseId, classDate]
      );
    }
  },

  getLogForDate: (courseId, classDate) =>
    all('SELECT student_id, present FROM attendance_log WHERE course_id = ? AND class_date = ?', [courseId, classDate]),

  getTotalsForCourse: (courseId) =>
    all(
      `SELECT a.student_id, a.classes_held, a.classes_attended, u.name AS student_name, u.student_id AS student_number
       FROM attendance a JOIN users u ON u.id = a.student_id WHERE a.course_id = ? ORDER BY u.name`,
      [courseId]
    ),

  getByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, c.code as course_code, c.name as course_name,
                ROUND(CASE WHEN a.classes_held > 0 THEN (a.classes_attended * 100.0 / a.classes_held) ELSE 0 END, 1) as percentage
         FROM attendance a
         JOIN courses c ON a.course_id = c.id
         WHERE a.student_id = ?
         ORDER BY c.code`,
        [studentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getReport: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, c.code as course_code, c.name as course_name,
                ROUND(CASE WHEN a.classes_held > 0 THEN (a.classes_attended * 100.0 / a.classes_held) ELSE 0 END, 1) as percentage
         FROM attendance a
         JOIN courses c ON a.course_id = c.id
         ORDER BY c.code, a.student_id`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Record one more class for a student: held +1, attended +1 if present.
  markClass: ({ studentId, courseId, present }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO attendance (student_id, course_id, classes_held, classes_attended)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(student_id, course_id) DO UPDATE SET
           classes_held = classes_held + 1,
           classes_attended = classes_attended + excluded.classes_attended`,
        [studentId, courseId, present ? 1 : 0],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  createOrUpdate: ({ studentId, courseId, classesHeld, classesAttended }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO attendance (student_id, course_id, classes_held, classes_attended)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(student_id, course_id) DO UPDATE SET
           classes_held = excluded.classes_held,
           classes_attended = excluded.classes_attended`,
        [studentId, courseId, classesHeld, classesAttended],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },
};

module.exports = Attendance;
