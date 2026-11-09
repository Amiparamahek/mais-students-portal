const db = require('../config/database');

// Admins can manage any course. A lecturer can manage only the courses assigned to them.
const canManageCourse = (user, courseId) => {
  if (user.role === 'admin') return Promise.resolve(true);
  if (user.role !== 'lecturer') return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM courses WHERE id = ? AND lecturer_id = ?', [courseId, user.id], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
};

module.exports = { canManageCourse };
