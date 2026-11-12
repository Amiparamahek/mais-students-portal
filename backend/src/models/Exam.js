const db = require('../config/database');

const Exam = {
  // Admin: all exams. Student: exams for classes they are enrolled in.
  getVisible: ({ id, role }) => {
    const scope = role === 'admin'
      ? ''
      : "WHERE e.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'enrolled')";
    const params = role === 'admin' ? [] : [id];
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.*, c.code, c.name
         FROM exams e
         JOIN courses c ON e.course_id = c.id
         ${scope}
         ORDER BY e.exam_date ASC, e.exam_time ASC`,
        params,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  remove: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM exams WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  create: ({ courseId, examName, examDate, examTime, examEndTime, room }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO exams (course_id, exam_name, exam_date, exam_time, exam_end_time, room) VALUES (?, ?, ?, ?, ?, ?)`,
        [courseId, examName, examDate, examTime, examEndTime, room],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },
};

module.exports = Exam;
