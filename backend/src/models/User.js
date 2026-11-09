const db = require('../config/database');

const User = {
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: ({ name, email, passwordHash, role = 'student', studentId, faculty, programme, academicYear }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (name, email, password_hash, role, student_id, faculty, programme, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, passwordHash, role, studentId, faculty, programme, academicYear],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  updateProfile: (id, { name, email }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, email, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  updatePassword: (id, passwordHash) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [passwordHash, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status, created_at FROM users`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
};

module.exports = User;
