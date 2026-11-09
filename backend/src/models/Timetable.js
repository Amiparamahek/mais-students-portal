const db = require('../config/database');

const Timetable = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, c.code as course_code, c.name as course_name, c.lecturer
         FROM timetable t
         JOIN courses c ON t.course_id = c.id
         ORDER BY 
           CASE t.day
             WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
             WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
           END, t.time`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  create: ({ courseId, day, time, room, week }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO timetable (course_id, day, time, room, week) VALUES (?, ?, ?, ?, ?)`,
        [courseId, day, time, room, week],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  update: (id, fields) => {
    // Normalize snake_case keys to DB column names (already snake_case)
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE timetable SET ${setClause} WHERE id = ?`,
        [...values, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  remove: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM timetable WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};

module.exports = Timetable;
