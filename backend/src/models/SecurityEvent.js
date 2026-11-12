const db = require('../config/database');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

const SecurityEvent = {
  // Raises an event once per dedupe key. Returns true when a new event was stored.
  raise: async ({ type, severity, userId, otherUserId, timetableId, classDate, deviceId, ip, details, dedupeKey }) => {
    const res = await run(
      `INSERT OR IGNORE INTO security_events
         (type, severity, user_id, other_user_id, timetable_id, class_date, device_id, ip, details, dedupe_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, severity, userId ?? null, otherUserId ?? null, timetableId ?? null, classDate ?? null,
       deviceId ?? null, ip ?? null, details ? JSON.stringify(details) : null, dedupeKey]
    );
    return res.changes === 1;
  },

  list: ({ status = 'open', limit = 100 } = {}) =>
    all(
      `SELECT e.id, e.type, e.severity, e.status, e.user_id, e.other_user_id, e.timetable_id, e.class_date,
              e.device_id, e.ip, e.details, e.review_note, e.reviewed_at, e.created_at,
              u.name AS student_name, u.student_id AS student_number,
              o.name AS other_name, o.student_id AS other_number,
              t.time AS lecture_time, c.code AS course_code
       FROM security_events e
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN users o ON o.id = e.other_user_id
       LEFT JOIN timetable t ON t.id = e.timetable_id
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE (? = 'all' OR e.status = ?)
       ORDER BY CASE e.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, e.created_at DESC, e.id DESC
       LIMIT ?`,
      [status, status, Math.min(Number(limit) || 100, 500)]
    ),

  // Marks an event reviewed or dismissed. A note is required so the decision is explained.
  review: (id, { status, note, reviewerId }) =>
    run(
      `UPDATE security_events SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, note || null, reviewerId, id]
    ),

  get: (id) => get('SELECT * FROM security_events WHERE id = ?', [id]),

  forStudent: (userId) =>
    all(
      `SELECT id, type, severity, status, other_user_id, class_date, device_id, ip, details, created_at
       FROM security_events WHERE user_id = ? OR other_user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId, userId]
    ),

  summary: async () => {
    const counts = await get(
      `SELECT
         SUM(CASE WHEN status = 'open' AND severity = 'high' THEN 1 ELSE 0 END) AS open_high,
         SUM(CASE WHEN status = 'open' AND severity = 'medium' THEN 1 ELSE 0 END) AS open_medium,
         SUM(CASE WHEN status = 'open' AND severity = 'info' THEN 1 ELSE 0 END) AS open_info,
         SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_total
       FROM security_events`
    );
    const failed = await get(
      `SELECT COUNT(*) AS n FROM login_log WHERE success = 0 AND logged_in_at >= datetime('now', '-24 hours')`
    );
    const sessions = await get(
      'SELECT COUNT(*) AS n FROM sessions WHERE revoked_at IS NULL AND last_seen_at >= datetime(\'now\', \'-30 minutes\')'
    );
    return {
      open_high: counts.open_high || 0,
      open_medium: counts.open_medium || 0,
      open_info: counts.open_info || 0,
      open_total: counts.open_total || 0,
      failed_logins_24h: failed.n,
      active_sessions_now: sessions.n,
    };
  },
};

module.exports = SecurityEvent;
