const db = require('../config/database');

const Document = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM documents ORDER BY uploaded_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  create: ({ title, fileUrl, category }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (title, file_url, category) VALUES (?, ?, ?)`,
        [title, fileUrl, category],
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
