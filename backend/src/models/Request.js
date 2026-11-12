const db = require('../config/database');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

// Unread flags come from message ids: a thread is unread for a side when the other side has
// written a message with a higher id than the last one this side has seen.
const SELECT_THREAD = `
  SELECT r.id, r.student_id, r.category, r.subject, r.status, r.created_at, r.updated_at,
         r.last_notified_at, r.student_read_msg_id, r.admin_read_msg_id,
         u.name AS student_name, u.student_id AS student_number,
         (SELECT COALESCE(MAX(id), 0) FROM request_messages m WHERE m.request_id = r.id AND m.sender_role = 'student') AS last_student_msg,
         (SELECT COALESCE(MAX(id), 0) FROM request_messages m WHERE m.request_id = r.id AND m.sender_role = 'admin') AS last_admin_msg,
         (SELECT body FROM request_messages m WHERE m.request_id = r.id ORDER BY m.id DESC LIMIT 1) AS last_body,
         (SELECT created_at FROM request_messages m WHERE m.request_id = r.id ORDER BY m.id DESC LIMIT 1) AS last_at
  FROM requests r JOIN users u ON u.id = r.student_id`;

const Request = {
  create: async ({ studentId, category, subject, body }) => {
    const res = await run('INSERT INTO requests (student_id, category, subject) VALUES (?, ?, ?)', [studentId, category, subject]);
    await run("INSERT INTO request_messages (request_id, sender_id, sender_role, kind, body) VALUES (?, ?, 'student', 'message', ?)", [res.lastID, studentId, body]);
    return res.lastID;
  },

  // A student sees their own; an admin sees all. Unread counts are included for the viewer.
  list: ({ viewerRole, viewerId, status, category, unreadOnly }) => {
    const where = [];
    const params = [];
    if (viewerRole === 'student') {
      where.push('r.student_id = ?');
      params.push(viewerId);
    }
    if (status && status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (category) {
      where.push('r.category = ?');
      params.push(category);
    }
    const sql = `${SELECT_THREAD} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.updated_at DESC, r.id DESC LIMIT 200`;
    return all(sql, params).then((rows) =>
      rows
        .map((r) => ({ ...r, unread: viewerRole === 'admin' ? r.last_student_msg > r.admin_read_msg_id : r.last_admin_msg > r.student_read_msg_id }))
        .filter((r) => !unreadOnly || r.unread)
    );
  },

  get: (id) => get(`${SELECT_THREAD} WHERE r.id = ?`, [id]),

  messages: (requestId) =>
    all(
      `SELECT m.id, m.sender_role, m.kind, m.body, m.created_at, u.name AS sender_name
       FROM request_messages m JOIN users u ON u.id = m.sender_id
       WHERE m.request_id = ? ORDER BY m.id`,
      [requestId]
    ),

  addMessage: (requestId, { senderId, senderRole, kind = 'message', body }) =>
    run('INSERT INTO request_messages (request_id, sender_id, sender_role, kind, body) VALUES (?, ?, ?, ?, ?)', [requestId, senderId, senderRole, kind, body]).then(() =>
      run('UPDATE requests SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [requestId])
    ).then(async () => {
      // Both sides of the thread see the change right away.
      const r = await get('SELECT student_id FROM requests WHERE id = ?', [requestId]);
      const { emitTo, emitAdmins } = require('../utils/events');
      emitTo(r?.student_id, { type: 'request', id: requestId });
      emitAdmins({ type: 'request', id: requestId });
    }),

  setStatus: (id, status) => run('UPDATE requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]),

  markRead: (id, side) => {
    const col = side === 'admin' ? 'admin_read_msg_id' : 'student_read_msg_id';
    const from = side === 'admin' ? 'student' : 'admin';
    return run(
      `UPDATE requests SET ${col} = (SELECT COALESCE(MAX(id), 0) FROM request_messages WHERE request_id = ? AND sender_role = ?) WHERE id = ?`,
      [id, from, id]
    );
  },

  // Limits: open threads, and new threads today.
  counts: async (studentId) => {
    const open = await get("SELECT COUNT(*) AS n FROM requests WHERE student_id = ? AND status = 'open'", [studentId]);
    const today = await get("SELECT COUNT(*) AS n FROM requests WHERE student_id = ? AND created_at >= datetime('now', '-1 day')", [studentId]);
    return { open: open.n, today: today.n };
  },

  // Seconds since this student last wrote in the thread (null if never).
  secondsSinceStudentMessage: async (requestId) => {
    const row = await get(
      "SELECT (julianday('now') - julianday(created_at)) * 86400 AS secs FROM request_messages WHERE request_id = ? AND sender_role = 'student' ORDER BY id DESC LIMIT 1",
      [requestId]
    );
    return row ? row.secs : null;
  },

  // Returns true when a "new reply" notification was sent (digest: at most one per window).
  notifyDigest: async (request, text, minutes) => {
    const recent = await get(
      "SELECT 1 FROM requests WHERE id = ? AND last_notified_at >= datetime('now', ?)",
      [request.id, `-${minutes} minutes`]
    );
    if (recent) return false;
    await run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [request.student_id, 'Request update', text]);
    require('../utils/events').emitTo(request.student_id, { type: 'notification' });
    await run('UPDATE requests SET last_notified_at = CURRENT_TIMESTAMP WHERE id = ?', [request.id]);
    return true;
  },

  summary: async () => {
    const open = await get("SELECT COUNT(*) AS n FROM requests WHERE status = 'open'");
    const unread = await get(
      `SELECT COUNT(*) AS n FROM requests r
       WHERE r.status = 'open' AND (SELECT COALESCE(MAX(id), 0) FROM request_messages m WHERE m.request_id = r.id AND m.sender_role = 'student') > r.admin_read_msg_id`
    );
    return { open: open.n, unread: unread.n };
  },
};

module.exports = Request;
