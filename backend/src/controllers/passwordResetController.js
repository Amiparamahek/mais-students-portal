const crypto = require('crypto');
const db = require('../config/database');
const User = require('../models/User');
const Session = require('../models/Session');
const { hashPassword } = require('../utils/auth');
const { validatePassword, validateEmail } = require('../utils/validate');
const { sendPasswordReset } = require('../utils/mailer');

const TTL_MINUTES = 30;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

const GENERIC = 'If an account exists for that email, a reset link has been sent. The link works for 30 minutes.';

// Always answers the same way, so it cannot be used to find out which emails have accounts.
const forgot = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim();
    if (validateEmail(email)) return res.json({ message: GENERIC });
    const user = await User.findByEmail(email);
    if (user && user.is_active && !user.deleted_at && user.approval_status !== 'pending') {
      const token = crypto.randomBytes(32).toString('base64url');
      await run(
        "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', ?))",
        [user.id, sha256(token), `+${TTL_MINUTES} minutes`]
      );
      const base = process.env.PUBLIC_URL || 'http://localhost:3000';
      await sendPasswordReset({ to: user.email, name: user.name, link: `${base}/reset?token=${token}` });
    }
    res.json({ message: GENERIC });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sets the new password. The token works once; every existing session is ended.
const reset = async (req, res) => {
  try {
    const token = String(req.body.token || '');
    const password = req.body.password;
    const problem = validatePassword(password);
    if (problem) return res.status(400).json({ message: problem });
    const row = await get(
      "SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')",
      [sha256(token)]
    );
    if (!row) return res.status(400).json({ message: 'This reset link is invalid or has expired. Ask for a new one.' });
    await User.updatePassword(row.user_id, await hashPassword(password));
    await run('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
    await Session.revokeAll(row.user_id, 'password');
    res.json({ message: 'Password changed. You can sign in with the new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { forgot, reset };
