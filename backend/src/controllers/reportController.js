const db = require('../config/database');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

// One row per enrolled class: attendance, grades, latest result.
const getMyResults = async (req, res) => {
  try {
    const [classes, grades, attendance] = await Promise.all([
      all(
        `SELECT c.id AS course_id, c.code, c.name, c.credits, c.semester
         FROM enrollments e JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = ? AND e.status = 'enrolled' ORDER BY c.code`,
        [req.user.id]
      ),
      Grade.getByStudent(req.user.id),
      Attendance.getByStudent(req.user.id),
    ]);
    const rows = classes.map((c) => {
      const att = attendance.find((a) => a.course_id === c.course_id);
      const own = grades.filter((g) => g.course_id === c.course_id);
      return {
        ...c,
        lectures_held: att?.classes_held ?? 0,
        lectures_attended: att?.classes_attended ?? 0,
        attendance_percentage: att && att.classes_held > 0 ? att.percentage : null,
        grades: own.map((g) => ({ assessment: g.assessment, grade: g.grade, grade_date: g.grade_date })),
        latest_grade: own[0]?.grade ?? null,
      };
    });
    const held = rows.reduce((n, r) => n + r.lectures_held, 0);
    const attended = rows.reduce((n, r) => n + r.lectures_attended, 0);
    res.json({
      classes: rows,
      overall: {
        classes: rows.length,
        grades_published: grades.length,
        attendance_percentage: held ? Math.round((attended * 1000) / held) / 10 : null,
      },
    });
  } catch (err) {
    fail(res, err);
  }
};

// CSV cells that start with = + - @ can run as formulas in Excel. Neutralise them.
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const toCsv = (headers, rows) =>
  [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\r\n') + '\r\n';

const EXPORTS = {
  students: {
    sql: `SELECT name, email, student_id, programme, faculty, academic_year, study_status,
                 CASE WHEN is_active = 1 THEN 'active' ELSE 'deactivated' END AS status, created_at
          FROM users WHERE role = 'student' AND deleted_at IS NULL ORDER BY name`,
    headers: ['name', 'email', 'student_id', 'programme', 'faculty', 'academic_year', 'study_status', 'status', 'created_at'],
  },
  grades: {
    sql: `SELECT u.name AS student, u.student_id, c.code AS course_code, g.assessment, g.grade, g.status, g.grade_date
          FROM grades g JOIN users u ON u.id = g.student_id JOIN courses c ON c.id = g.course_id
          ORDER BY c.code, u.name, g.grade_date`,
    headers: ['student', 'student_id', 'course_code', 'assessment', 'grade', 'status', 'grade_date'],
  },
  attendance: {
    sql: `SELECT u.name AS student, u.student_id, c.code AS course_code, c.name AS course_name,
                 a.classes_held, a.classes_attended,
                 CASE WHEN a.classes_held > 0 THEN ROUND(a.classes_attended * 100.0 / a.classes_held, 1) ELSE NULL END AS percentage
          FROM attendance a JOIN users u ON u.id = a.student_id JOIN courses c ON c.id = a.course_id
          ORDER BY c.code, u.name`,
    headers: ['student', 'student_id', 'course_code', 'course_name', 'classes_held', 'classes_attended', 'percentage'],
  },
  attendance_log: {
    sql: `SELECT u.name AS student, u.student_id, c.code AS course_code, l.class_date, l.present,
                 CASE WHEN l.recorded_by = l.student_id THEN 'student check-in'
                      WHEN l.recorded_by IS NULL THEN 'automatic' ELSE 'admin' END AS source
          FROM attendance_log l JOIN users u ON u.id = l.student_id JOIN courses c ON c.id = l.course_id
          ORDER BY l.class_date DESC, c.code, u.name`,
    headers: ['student', 'student_id', 'course_code', 'class_date', 'present', 'source'],
  },
};

const exportCsv = async (req, res) => {
  const kind = EXPORTS[req.params.kind];
  if (!kind) return res.status(404).json({ message: `Unknown export. Use one of: ${Object.keys(EXPORTS).join(', ')}` });
  try {
    const rows = await all(kind.sql);
    const file = `mais-${req.params.kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    res.send('\ufeff' + toCsv(kind.headers, rows));
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getMyResults, exportCsv, csvCell, toCsv };
