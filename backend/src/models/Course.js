const db = require('../config/database');

const selectCourse = (extra = '') => `
  SELECT c.*,
    p.code AS prerequisite_code,
    p.name AS prerequisite_name,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled_count${extra}
  FROM courses c
  LEFT JOIN courses p ON p.id = c.prerequisite_course_id`;
const SELECT_COURSE = selectCourse();

// Only these columns may be written from request bodies.
const WRITABLE = ['code', 'name', 'credits', 'lecturer', 'semester', 'description', 'seats', 'prerequisite_course_id'];

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const Course = {
  getAll: () => all(`${SELECT_COURSE} ORDER BY c.code`),

  getById: (id) => get(`${SELECT_COURSE} WHERE c.id = ?`, [id]),

  // Catalog for students: matches code or name, and says whether the student is already enrolled.
  search: (q, studentId) => {
    const term = `%${(q || '').trim()}%`;
    const isEnrolled = `,
      EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = ? AND e.status = 'enrolled') AS is_enrolled`;
    return all(
      `${selectCourse(isEnrolled)} WHERE c.code LIKE ? OR c.name LIKE ? ORDER BY c.code`,
      [studentId, term, term]
    );
  },

  create: (fields) => {
    const keys = Object.keys(fields).filter((k) => WRITABLE.includes(k) && fields[k] !== undefined);
    const sql = `INSERT INTO courses (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
    return new Promise((resolve, reject) =>
      db.run(sql, keys.map((k) => fields[k]), function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      })
    );
  },

  update: (id, fields) => {
    const keys = Object.keys(fields).filter((k) => WRITABLE.includes(k));
    if (keys.length === 0) return Promise.resolve({ changes: 0 });
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    return new Promise((resolve, reject) =>
      db.run(`UPDATE courses SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      })
    );
  },

  delete: (id) =>
    new Promise((resolve, reject) =>
      db.run('DELETE FROM courses WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      })
    ),
};

module.exports = Course;
