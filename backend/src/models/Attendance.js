const db = require('../config/database');

const Attendance = {
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
