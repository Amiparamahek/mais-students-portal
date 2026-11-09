const db = require('../config/database');

const Document = {
  // Admins see everything. Students see general documents plus those attached to a class they are enrolled in.
  getVisible: ({ id, role }) => {
    let sql = 'SELECT d.*, c.code AS course_code FROM documents d LEFT JOIN courses c ON c.id = d.course_id';
    const params = [];
    if (role === 'student') {
      sql += " WHERE d.course_id IS NULL OR d.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'enrolled')";
      params.push(id);
    }
    return new Promise((resolve, reject) => {
      db.all(`${sql} ORDER BY d.uploaded_at DESC`, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  },

  get: (id) =>
    new Promise((resolve, reject) =>
      db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => (err ? reject(err) : resolve(row)))
    ),

  // Same visibility rule as getVisible, for a single document (used by download).
  canAccess: async ({ id, role }, doc) => {
    if (role === 'admin') return true;
    if (doc.course_id == null) return true;
    return new Promise((resolve, reject) =>
      db.get(
        "SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'enrolled'",
        [id, doc.course_id],
        (err, row) => (err ? reject(err) : resolve(!!row))
      )
    );
  },

  create: ({ title, fileUrl, category, courseId, storedName, originalName, mimeType, sizeBytes }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (title, file_url, category, course_id, stored_name, original_name, mime_type, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, fileUrl || null, category, courseId || null, storedName || null, originalName || null, mimeType || null, sizeBytes || null],
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
