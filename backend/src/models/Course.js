const db = require('../config/database');

const Course = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM courses ORDER BY code', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM courses WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: ({ code, name, credits, lecturer, semester, description }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO courses (code, name, credits, lecturer, semester, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [code, name, credits, lecturer, semester, description],
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
    const setClause = keys.map((key, i) => `${key} = ?`).join(', ');
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE courses SET ${setClause} WHERE id = ?`,
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
      db.run('DELETE FROM courses WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};

module.exports = Course;
