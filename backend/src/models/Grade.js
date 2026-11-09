const db = require('../config/database');

const Grade = {
  getByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT g.*, c.code as course_code, c.name as course_name, c.credits
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

  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT g.*, c.code as course_code, c.name as course_name, u.name as student_name, u.student_id as student_number
         FROM grades g
         JOIN courses c ON g.course_id = c.id
         JOIN users u ON g.student_id = u.id
         ORDER BY g.grade_date DESC, g.id DESC`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  remove: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM grades WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
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
