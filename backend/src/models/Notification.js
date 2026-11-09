const db = require('../config/database');

const Notification = {
  getByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getUnreadCount: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
  },

  create: ({ userId, title, message }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [userId, title, message],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  markAsRead: (id, userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  markAllAsRead: (userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
        [userId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },
};

module.exports = Notification;
