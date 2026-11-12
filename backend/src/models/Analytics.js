const db = require('../config/database');
const { toISODate, weekdayOf, slotMinutes } = require('../utils/dates');
const { windowState } = require('../utils/sessions');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const AT_RISK_BELOW = 75; // percent

const pct = (attended, held) => (held > 0 ? Math.round((attended * 1000) / held) / 10 : null);

// Everything an admin wants to know about one student.
async function studentProfile(id) {
  const student = await get(
    `SELECT id, name, email, role, student_id, faculty, programme, academic_year, study_status,
            is_active, phone, created_at, updated_at
     FROM users WHERE id = ? AND role = 'student'`,
    [id]
  );
  if (!student) return null;

  const enrollments = await all(
    `SELECT e.enrolled_at, c.id AS course_id, c.code, c.name, c.credits, c.lecturer, c.semester
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.student_id = ? AND e.status = 'enrolled' ORDER BY c.code`,
    [id]
  );

  const attendance = (
    await all(
      `SELECT a.course_id, c.code, c.name, a.classes_held, a.classes_attended
       FROM attendance a JOIN courses c ON c.id = a.course_id
       WHERE a.student_id = ? ORDER BY c.code`,
      [id]
    )
  ).map((a) => ({ ...a, absences: a.classes_held - a.classes_attended, percentage: pct(a.classes_attended, a.classes_held) }));

  const held = attendance.reduce((n, a) => n + a.classes_held, 0);
  const attended = attendance.reduce((n, a) => n + a.classes_attended, 0);

  // recorded_by tells how the record got there: the student, an admin, or the automatic close.
  const attendanceLog = (
    await all(
      `SELECT l.class_date, l.present, l.recorded_by, c.code AS course_code, c.name AS course_name
       FROM attendance_log l JOIN courses c ON c.id = l.course_id
       WHERE l.student_id = ? ORDER BY l.class_date DESC, c.code LIMIT 60`,
      [id]
    )
  ).map((r) => ({
    class_date: r.class_date,
    course_code: r.course_code,
    course_name: r.course_name,
    present: r.present,
    source: r.recorded_by === id ? 'Checked in by student' : r.recorded_by == null ? 'Automatic (no check-in)' : 'Marked by admin',
  }));

  const dated = await get(
    `SELECT COUNT(*) AS recorded_days, COALESCE(SUM(present), 0) AS present_days,
            COUNT(DISTINCT class_date) AS distinct_dates
     FROM attendance_log WHERE student_id = ?`,
    [id]
  );

  const grades = await all(
    `SELECT g.id, g.assessment, g.grade, g.status, g.grade_date, c.code AS course_code, c.name AS course_name
     FROM grades g JOIN courses c ON c.id = g.course_id
     WHERE g.student_id = ? ORDER BY g.grade_date DESC, g.id DESC`,
    [id]
  );

  const loginSummary = await get(
    `SELECT COUNT(*) AS total_logins,
            COUNT(DISTINCT date(logged_in_at, 'localtime')) AS login_days,
            MIN(logged_in_at) AS first_login, MAX(logged_in_at) AS last_login
     FROM login_log WHERE user_id = ? AND success = 1`,
    [id]
  );
  const loginDays30 = await get(
    `SELECT COUNT(DISTINCT date(logged_in_at, 'localtime')) AS n FROM login_log
     WHERE user_id = ? AND success = 1 AND logged_in_at >= datetime('now', '-30 days')`,
    [id]
  );
  const failed30 = await get(
    `SELECT COUNT(*) AS n FROM login_log WHERE user_id = ? AND success = 0 AND logged_in_at >= datetime('now', '-30 days')`,
    [id]
  );
  const recentLogins = await all(
    `SELECT success, logged_in_at, ip, user_agent FROM login_log WHERE user_id = ? ORDER BY logged_in_at DESC, id DESC LIMIT 20`,
    [id]
  );

  const notifications = await get(
    `SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END), 0) AS unread
     FROM notifications WHERE user_id = ?`,
    [id]
  );

  const upcomingExams = await all(
    `SELECT x.exam_name, x.exam_date, x.exam_time, x.room, c.code
     FROM exams x JOIN courses c ON c.id = x.course_id
     WHERE x.exam_date >= date('now', 'localtime')
       AND x.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'enrolled')
     ORDER BY x.exam_date, x.exam_time LIMIT 10`,
    [id]
  );

  return {
    student,
    summary: {
      classes: enrollments.length,
      lectures_held: held,
      lectures_attended: attended,
      lectures_missed: held - attended,
      attendance_percentage: pct(attended, held),
      at_risk: held > 0 && attended * 100 < AT_RISK_BELOW * held,
      dated_records: dated.recorded_days,
      dated_present: dated.present_days,
      grades_published: grades.filter((g) => g.status === 'published').length,
      total_logins: loginSummary.total_logins,
      login_days: loginSummary.login_days,
      login_days_last_30: loginDays30.n,
      failed_logins_last_30: failed30.n,
      first_login: loginSummary.first_login,
      last_login: loginSummary.last_login,
      notifications_total: notifications.total,
      notifications_unread: notifications.unread,
    },
    enrollments,
    attendance,
    attendanceLog,
    grades,
    recentLogins,
    upcomingExams,
  };
}

// Where the whole college stands right now.
async function overview(now = new Date()) {
  const today = toISODate(now);
  const dayName = weekdayOf(now);

  const totals = await get(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
       (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = 1) AS active_students,
       (SELECT COUNT(*) FROM courses) AS courses,
       (SELECT COUNT(*) FROM enrollments WHERE status = 'enrolled') AS enrollments,
       (SELECT COALESCE(SUM(classes_held), 0) FROM attendance) AS held,
       (SELECT COALESCE(SUM(classes_attended), 0) FROM attendance) AS attended,
       (SELECT COUNT(*) FROM exams WHERE exam_date >= ?) AS upcoming_exams`,
    [today]
  );

  // Lectures scheduled for today and how many students have checked in.
  const slots = await all(
    `SELECT t.id, t.time, t.room, t.building, c.id AS course_id, c.code, c.name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled,
            (SELECT COUNT(*) FROM attendance_log l WHERE l.course_id = c.id AND l.class_date = ? AND l.present = 1) AS present,
            (SELECT COUNT(*) FROM attendance_log l WHERE l.course_id = c.id AND l.class_date = ? AND l.present = 0) AS absent
     FROM timetable t JOIN courses c ON c.id = t.course_id
     WHERE t.day = ? ORDER BY t.time`,
    [today, today, dayName]
  );
  const todayLectures = slots.map((s) => ({
    ...s,
    state: windowState(s.time, now, now), // upcoming | open | closed
    pending: Math.max(s.enrolled - s.present - s.absent, 0),
  }));

  // Sign-ins per day for the last 14 days.
  const loginRows = await all(
    `SELECT date(logged_in_at, 'localtime') AS day, COUNT(*) AS logins, COUNT(DISTINCT user_id) AS people
     FROM login_log
     WHERE success = 1 AND logged_in_at >= datetime('now', '-14 days')
     GROUP BY day`
  );
  const byDay = Object.fromEntries(loginRows.map((r) => [r.day, r]));
  const loginsByDay = [];
  for (let back = 13; back >= 0; back--) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    const key = toISODate(d);
    loginsByDay.push({ day: key, logins: byDay[key]?.logins || 0, people: byDay[key]?.people || 0 });
  }

  const onlineNow = await get(
    `SELECT COUNT(DISTINCT l.user_id) AS n FROM login_log l JOIN users u ON u.id = l.user_id
     WHERE l.success = 1 AND u.role = 'student' AND l.logged_in_at >= datetime('now', '-15 minutes')`
  );
  const loggedInToday = await get(
    `SELECT COUNT(DISTINCT l.user_id) AS n FROM login_log l JOIN users u ON u.id = l.user_id
     WHERE l.success = 1 AND u.role = 'student' AND date(l.logged_in_at, 'localtime') = ?`,
    [today]
  );
  const neverLoggedIn = await all(
    `SELECT u.id, u.name, u.student_id, u.created_at FROM users u
     WHERE u.role = 'student' AND NOT EXISTS (SELECT 1 FROM login_log l WHERE l.user_id = u.id AND l.success = 1)
     ORDER BY u.name`
  );

  const perStudent = await all(
    `SELECT u.id, u.name, u.student_id, u.programme,
            COALESCE(SUM(a.classes_held), 0) AS held, COALESCE(SUM(a.classes_attended), 0) AS attended
     FROM users u LEFT JOIN attendance a ON a.student_id = u.id
     WHERE u.role = 'student' GROUP BY u.id`
  );
  const ranked = perStudent
    .filter((s) => s.held > 0)
    .map((s) => ({ ...s, absences: s.held - s.attended, percentage: pct(s.attended, s.held) }));
  const mostAbsent = [...ranked].sort((a, b) => b.absences - a.absences || a.percentage - b.percentage).slice(0, 10);
  const atRisk = ranked.filter((s) => s.percentage < AT_RISK_BELOW).sort((a, b) => a.percentage - b.percentage);

  const perClass = (
    await all(
      `SELECT c.id, c.code, c.name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled,
              COALESCE(SUM(a.classes_held), 0) AS held, COALESCE(SUM(a.classes_attended), 0) AS attended
       FROM courses c LEFT JOIN attendance a ON a.course_id = c.id
       GROUP BY c.id ORDER BY c.code`
    )
  ).map((c) => ({ ...c, percentage: pct(c.attended, c.held) }));

  const recentLogins = await all(
    `SELECT l.logged_in_at, l.success, u.id AS user_id, u.name, u.role
     FROM login_log l JOIN users u ON u.id = l.user_id
     ORDER BY l.logged_in_at DESC, l.id DESC LIMIT 15`
  );

  return {
    generated_at: now.toISOString(),
    date: today,
    day: dayName,
    threshold: AT_RISK_BELOW,
    totals: {
      students: totals.students,
      active_students: totals.active_students,
      courses: totals.courses,
      enrollments: totals.enrollments,
      attendance_percentage: pct(totals.attended, totals.held),
      upcoming_exams: totals.upcoming_exams,
      online_now: onlineNow.n,
      logged_in_today: loggedInToday.n,
      never_logged_in: neverLoggedIn.length,
      at_risk: atRisk.length,
    },
    todayLectures,
    loginsByDay,
    mostAbsent,
    atRisk,
    perClass,
    neverLoggedIn,
    recentLogins,
  };
}

module.exports = { studentProfile, overview, AT_RISK_BELOW };
