const db = require('../config/database');

const Grade = {
  getByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT g.*, c.code, c.name, c.credits
         FROM grades g
         JOIN courses c ON g.course_id = c.id
         WHERE g.student_id = ? AND g.status = 'published'
         ORDER BY g.grade_date DESC`,
        [studentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  create: ({ studentId, courseId, assessment, grade, status = 'published' }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO grades (student_id, course_id, assessment, grade, status) VALUES (?, ?, ?, ?, ?)`,
        [studentId, courseId, assessment, grade, status],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },
};

module.exports = Grade;
