const db = require('../config/database');
const User = require('../models/User');
const Session = require('../models/Session');
const { nextStudentId } = require('../utils/studentIds');
const { notifyStudents } = require('../utils/notify');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};
const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const list = async (req, res) => {
  try {
    res.json(await all(
      `SELECT id, name, email, programme, faculty, academic_year, created_at FROM users
       WHERE approval_status = 'pending' AND deleted_at IS NULL ORDER BY created_at`
    ));
  } catch (err) {
    fail(res, err);
  }
};

// Approve: the account becomes active and gets the next student ID.
const approve = async (req, res) => {
  try {
    const user = await get("SELECT id, name FROM users WHERE id = ? AND approval_status = 'pending' AND deleted_at IS NULL", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'No pending registration with that id' });
    const studentId = await nextStudentId();
    await new Promise((resolve, reject) =>
      db.run(
        "UPDATE users SET approval_status = 'approved', is_active = 1, student_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [studentId, user.id],
        (err) => (err ? reject(err) : resolve())
      )
    );
    await notifyStudents('Account approved', `Welcome! Your student ID is ${studentId}. You can sign in now.`, user.id);
    res.json({ message: `Approved. ${user.name} is now ${studentId}.`, student_id: studentId });
  } catch (err) {
    fail(res, err);
  }
};

// Reject: the registration is removed (kept in the database, hidden, and unable to sign in).
const reject = async (req, res) => {
  try {
    const user = await get("SELECT id FROM users WHERE id = ? AND approval_status = 'pending' AND deleted_at IS NULL", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'No pending registration with that id' });
    await User.softDelete(user.id);
    await Session.revokeAll(user.id, 'deactivated');
    res.json({ message: 'Registration rejected' });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { list, approve, reject };
