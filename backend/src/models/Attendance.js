const db = require('../config/database');

const Attendance = {
  getByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, c.code, c.name,
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
