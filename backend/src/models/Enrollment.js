const db = require('../config/database');

const Enrollment = {
  getByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.*, c.code, c.name, c.credits, c.lecturer, c.semester
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.student_id = ? AND e.status = 'enrolled'
         ORDER BY c.code`,
        [studentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  enroll: (studentId, courseId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO enrollments (student_id, course_id, status) VALUES (?, ?, 'enrolled')`,
        [studentId, courseId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  unenroll: (studentId, courseId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'enrolled'`,
        [studentId, courseId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  getByCourse: (courseId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT u.id, u.name, u.email, u.student_id, u.faculty, u.programme, u.academic_year
         FROM enrollments e
         JOIN users u ON e.student_id = u.id
         WHERE e.course_id = ? AND e.status = 'enrolled'
         ORDER BY u.name`,
        [courseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  isEnrolled: (studentId, courseId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'enrolled'`,
        [studentId, courseId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  },
};

module.exports = Enrollment;
