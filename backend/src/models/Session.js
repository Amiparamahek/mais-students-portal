const db = require('../config/database');
const crypto = require('crypto');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

const Session = {
  create: async ({ userId, deviceId, ip, userAgent }) => {
    const id = crypto.randomBytes(24).toString('hex');
    await run(
      'INSERT INTO sessions (id, user_id, device_id, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
      [id, userId, deviceId || null, ip || null, (userAgent || '').slice(0, 200)]
    );
    return id;
  },

  // Active = exists and not revoked. Also refreshes last_seen at most once every 5 minutes.
  findActive: async (id) => {
    const row = await get('SELECT id, user_id, last_seen_at FROM sessions WHERE id = ? AND revoked_at IS NULL', [id]);
    if (row) {
      const stale = await get("SELECT (julianday('now') - julianday(?)) * 1440 > 5 AS stale", [row.last_seen_at]);
      if (stale && stale.stale) {
        await run("UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
      }
    }
    return row;
  },

  revoke: (id, reason) =>
    run('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP, revoke_reason = ? WHERE id = ? AND revoked_at IS NULL', [reason, id]),

  // Ends every session of a user except one (used when a student signs in on a new device).
  revokeOthers: (userId, keepId, reason) =>
    run(
      'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP, revoke_reason = ? WHERE user_id = ? AND revoked_at IS NULL AND id <> ?',
      [reason, userId, keepId || '']
    ),

  revokeAll: (userId, reason) =>
    run('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP, revoke_reason = ? WHERE user_id = ? AND revoked_at IS NULL', [reason, userId]),

  listForUser: (userId) =>
    all(
      `SELECT id, device_id, ip, user_agent, created_at, last_seen_at, revoked_at, revoke_reason
       FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    ),
};

module.exports = Session;
