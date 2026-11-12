const db = require('../config/database');

const Timetable = {
  get: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM timetable WHERE id = ?', [id], (err, row) => (err ? reject(err) : resolve(row)));
    });
  },

  // Every slot on one weekday, with the class code, for clash checks. Pass excludeId to skip one slot.
  sameDay: (day, excludeId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.id, t.day, t.time, t.building, t.room, c.code AS course_code, c.name AS course_name
         FROM timetable t JOIN courses c ON c.id = t.course_id
         WHERE t.day = ? AND (? IS NULL OR t.id != ?)`,
        [day, excludeId ?? null, excludeId ?? null],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  // Admin: whole timetable. Student: only classes they are enrolled in.
  getVisible: ({ id, role }) => {
    let where = '';
    const params = [];
    if (role !== 'admin') {
      where = "WHERE t.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'enrolled')";
      params.push(id);
    }
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, c.code as course_code, c.name as course_name, c.lecturer, c.id AS course_id
         FROM timetable t
         JOIN courses c ON t.course_id = c.id
         ${where}
         ORDER BY
           CASE t.day
             WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
             WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
           END, t.time`,
        params,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  create: ({ courseId, day, time, building, room, week }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO timetable (course_id, day, time, building, room, week) VALUES (?, ?, ?, ?, ?, ?)`,
        [courseId, day, time, building, room, week],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  update: (id, fields) => {
    // Normalize snake_case keys to DB column names (already snake_case)
    const WRITABLE = ['course_id', 'day', 'time', 'building', 'room', 'week'];
    const keys = Object.keys(fields).filter((k) => WRITABLE.includes(k));
    if (keys.length === 0) return Promise.resolve({ changes: 0 });
    const values = keys.map((k) => fields[k]);
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
