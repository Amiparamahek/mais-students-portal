const { verifyToken } = require('../utils/auth');
const db = require('../config/database');
const Session = require('../models/Session');

const SIGNED_OUT = {
  replaced: 'You were signed out because your account was used on another device.',
  logout: 'You have signed out.',
  admin: 'Your session was ended by an administrator. Sign in again.',
  deactivated: 'This account has been deactivated. Contact an administrator.',
  password: 'Your password was changed. Sign in again with the new password.',
  default: 'Your session has ended. Sign in again.',
};

const userRow = (id) =>
  new Promise((resolve, reject) =>
    db.get('SELECT id, email, role, is_active, deleted_at FROM users WHERE id = ?', [id], (err, row) => (err ? reject(err) : resolve(row)))
  );

// Checks the token, then that its session is still active and the account is still enabled.
// The role comes from the database, so a changed role or a deactivation takes effect at once.
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  let decoded;
  try {
    decoded = verifyToken(authHeader.split(' ')[1]);
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
  if (!decoded.sid) {
    // Issued before sessions existed: ask the user to sign in once.
    return res.status(401).json({ message: 'Your session has ended. Sign in again.' });
  }

  try {
    const session = await Session.findActive(decoded.sid);
    if (!session) {
      const row = await new Promise((resolve, reject) =>
        db.get('SELECT revoke_reason FROM sessions WHERE id = ?', [decoded.sid], (err, r) => (err ? reject(err) : resolve(r)))
      );
      const reason = row?.revoke_reason;
      return res.status(401).json({ message: SIGNED_OUT[reason] || SIGNED_OUT.default, reason: reason || 'default' });
    }

    const user = await userRow(decoded.id);
    if (!user || user.is_active === 0 || user.deleted_at) {
      return res.status(401).json({ message: SIGNED_OUT.deactivated, reason: 'deactivated' });
    }

    req.user = { id: user.id, email: user.email, role: user.role, sid: decoded.sid };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { auth, adminOnly };
