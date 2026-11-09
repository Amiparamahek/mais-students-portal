const db = require('../config/database');

const Timetable = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, c.code, c.name, c.lecturer
         FROM timetable t
         JOIN courses c ON t.course_id = c.id
         ORDER BY 
           CASE t.day
             WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3
             WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 WHEN 'SAT' THEN 6 WHEN 'SUN' THEN 7
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
};

module.exports = Timetable;
