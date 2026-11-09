const db = require('../config/database');

const Announcement = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, u.name as created_by_name
         FROM announcements a
         JOIN users u ON a.created_by = u.id
         WHERE a.is_published = 1
         ORDER BY a.created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  create: ({ title, content, createdBy, isPublished = 1 }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO announcements (title, content, created_by, is_published) VALUES (?, ?, ?, ?)`,
        [title, content, createdBy, isPublished],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  update: (id, fields) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE announcements SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM announcements WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};

module.exports = Announcement;
