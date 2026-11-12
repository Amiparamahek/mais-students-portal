const db = require('../config/database');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const bcrypt = require('bcryptjs');
const { validateEmail, validateName, validatePassword } = require('../utils/validate');
const Session = require('../models/Session');
const Detect = require('../utils/detect');

const deviceOf = (req) => (req.headers['x-device-id'] || '').toString().slice(0, 64) || null;

// Starts a session and returns its token. A student may be signed in on one device only:
// the earlier sessions are ended, so a shared password cannot run two sessions at once.
const startSession = async (req, user) => {
  const sid = await Session.create({ userId: user.id, deviceId: deviceOf(req), ip: req.ip, userAgent: req.headers['user-agent'] });
  if (user.role === 'student') {
    const ended = await Session.revokeOthers(user.id, sid, 'replaced');
    if (ended.changes > 0) await detectSafely(() => Detect.afterSessionReplaced({ userId: user.id }));
  }
  return generateToken(user, sid);
};

// Comparing against this when the email is unknown keeps the response time the same, so
// the timing does not reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const LOCK_AFTER_FAILURES = 5;
const LOCK_MINUTES = 15;

// Failed sign-ins since the last successful one, within the lock window.
const recentFailures = (userId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT COUNT(*) AS n FROM login_log
       WHERE user_id = ? AND success = 0
         AND logged_in_at >= datetime('now', ?)
         AND id > COALESCE((SELECT MAX(id) FROM login_log WHERE user_id = ? AND success = 1), 0)`,
      [userId, `-${LOCK_MINUTES} minutes`, userId],
      (err, row) => (err ? reject(err) : resolve(row.n))
    )
  );

const tooLong = (value, label) =>
  value !== undefined && value !== null && String(value).length > 100 ? `${label} must be 100 characters or fewer` : null;

const register = async (req, res) => {
  try {
    const { name, email, password, studentId, faculty, programme, academicYear } = req.body;

    const problem =
      validateName(name) ||
      validateEmail(email) ||
      validatePassword(password) ||
      tooLong(studentId, 'Student ID') ||
      tooLong(faculty, 'Faculty') ||
      tooLong(programme, 'Programme') ||
      tooLong(academicYear, 'Academic year');
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const existingUser = await User.findByEmail(email.trim());
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Self-registration always creates a student. Admins and lecturers are created by an admin.
    const passwordHash = await hashPassword(password);
    const result = await User.create({ name: name.trim(), email: email.trim(), passwordHash, role: 'student', studentId, faculty, programme, academicYear });

    const user = await User.findById(result.id);
    const token = await startSession(req, user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, studentId: user.student_id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Best effort: a failure to write the log must never block signing in.
const recordLogin = (req, userId, success) =>
  new Promise((resolve) =>
    db.run(
      'INSERT INTO login_log (user_id, success, ip, user_agent, device_id) VALUES (?, ?, ?, ?, ?)',
      [userId, success ? 1 : 0, req.ip, (req.headers['user-agent'] || '').slice(0, 200), deviceOf(req)],
      (err) => {
        if (err) console.error('login log failed:', err.message);
        resolve();
      }
    )
  );

// Detection runs after the sign-in is logged, and never blocks the response.
const detectSafely = (fn) => fn().catch((err) => console.error('detection failed:', err.message));

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findByEmail(String(email).trim());
    if (!user) {
      await comparePassword(String(password), DUMMY_HASH);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Locked after repeated failures. Attempts while locked are not logged, so the lock
    // ends LOCK_MINUTES after the last real failure and cannot be extended by an attacker.
    if ((await recentFailures(user.id)) >= LOCK_AFTER_FAILURES) {
      await detectSafely(() => Detect.onAccountLocked({ userId: user.id, ip: req.ip, deviceId: deviceOf(req) }));
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` });
    }

    const isMatch = await comparePassword(String(password), user.password_hash);
    if (!isMatch) {
      await recordLogin(req, user.id, false);
      await detectSafely(() => Detect.afterFailedLogin({ userId: user.id, ip: req.ip, deviceId: deviceOf(req) }));
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.is_active === 0) {
      await recordLogin(req, user.id, false);
      return res.status(403).json({ message: 'This account is deactivated. Contact an administrator.' });
    }

    await recordLogin(req, user.id, true);
    if (user.role === 'student') {
      await detectSafely(() => Detect.afterStudentLogin({ userId: user.id, deviceId: deviceOf(req), ip: req.ip }));
    }
    const token = await startSession(req, user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, studentId: user.student_id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    await Session.revoke(req.user.sid, 'logout');
    res.json({ message: 'Signed out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    const weak = validatePassword(newPassword);
    if (weak) {
      return res.status(400).json({ message: weak });
    }

    const user = await User.findByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updatePassword(req.user.id, passwordHash);
    // Other devices must sign in again with the new password; this one stays signed in.
    await Session.revokeOthers(req.user.id, req.user.sid, 'password');

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, logout, me, changePassword, startSession };
