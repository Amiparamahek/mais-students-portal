const db = require('../config/database');

const Exam = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.*, c.code, c.name
         FROM exams e
         JOIN courses c ON e.course_id = c.id
         ORDER BY e.exam_date ASC, e.exam_time ASC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  create: ({ courseId, examName, examDate, examTime, room }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO exams (course_id, exam_name, exam_date, exam_time, room) VALUES (?, ?, ?, ?, ?)`,
        [courseId, examName, examDate, examTime, room],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },
};

module.exports = Exam;
