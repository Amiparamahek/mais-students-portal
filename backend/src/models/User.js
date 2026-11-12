const db = require('../config/database');

const User = {
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Includes password_hash; only for verifying a password change.
  findByIdWithPassword: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status, is_active, avatar_url, phone, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Student IDs already used with this prefix, e.g. 'MAIS-2026-%'.
  findStudentIdsLike: (pattern) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT student_id FROM users WHERE student_id LIKE ?', [pattern], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((r) => r.student_id));
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
      db.all(`SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status, is_active, created_at FROM users`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getStudents: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status, is_active, created_at FROM users WHERE role = 'student'`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  update: (id, fields) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key, i) => `${key} = ?`).join(', ');
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
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
      db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  toggleActive: (id, isActive) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isActive ? 1 : 0, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },
};

module.exports = User;
