const db = require('../config/database');

const Document = {
  // Admins see everything. Students and lecturers see general documents plus those
  // attached to a course they are enrolled in or teach.
  getVisible: ({ id, role }) => {
    let sql = 'SELECT d.*, c.code AS course_code FROM documents d LEFT JOIN courses c ON c.id = d.course_id';
    const params = [];
    if (role === 'student') {
      sql += " WHERE d.course_id IS NULL OR d.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'enrolled')";
      params.push(id);
    } else if (role === 'lecturer') {
      sql += ' WHERE d.course_id IS NULL OR d.course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)';
      params.push(id);
    }
    return new Promise((resolve, reject) => {
      db.all(`${sql} ORDER BY d.uploaded_at DESC`, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  },

  create: ({ title, fileUrl, category, courseId }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (title, file_url, category, course_id) VALUES (?, ?, ?, ?)`,
        [title, fileUrl, category, courseId || null],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  remove: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM documents WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};

module.exports = Document;
