// Cheating and threat detection. Every rule raises a flag for an admin to review; the only
// thing ever refused is an off-campus check-in, and only when CHECKIN_OFF_CAMPUS=block.
const db = require('../config/database');
const SecurityEvent = require('../models/SecurityEvent');
const { inRanges, normalise } = require('./net');
const settings = require('./settings');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const THRESHOLDS = {
  manyAccountsPerDevice: 3, // distinct student accounts signing in from one browser in 24 h
  sessionChurnPerDay: 3, // sessions ended by a newer sign-in in one day
  buddyLectures: 3, // lectures on which the same pair shares a device
  failedLogins: 5, // failed sign-ins in an hour
};

const day = (d = new Date()) => d.toISOString().slice(0, 10);
const hour = (d = new Date()) => d.toISOString().slice(0, 13);

// Called before a check-in is recorded. Returns { flagged, block } so the caller can refuse.
function checkCampus({ studentId, timetableId, classDate, ip }) {
  const { campusRanges, checkinOffCampus } = settings.get();
  if (!campusRanges || campusRanges.length === 0) return { flagged: false, block: false };
  if (inRanges(ip, campusRanges)) return { flagged: false, block: false };
  return { flagged: true, block: checkinOffCampus === 'block' };
}

async function raiseOffCampus({ studentId, timetableId, classDate, ip, deviceId, blocked }) {
  await SecurityEvent.raise({
    type: 'off_campus_checkin',
    severity: 'high',
    userId: studentId,
    timetableId,
    classDate,
    ip: normalise(ip),
    deviceId,
    details: { address: normalise(ip), campus_ranges: settings.get().campusRanges, blocked },
    dedupeKey: `offcampus:${studentId}:${timetableId}:${classDate}`,
  });
}

// After a check-in is recorded: students sharing one device on the same lecture, and pairs
// that do this repeatedly.
async function afterCheckIn({ studentId, courseId, timetableId, classDate, deviceId, ip }) {
  if (!deviceId) return;
  const others = await all(
    `SELECT DISTINCT student_id FROM attendance_log
     WHERE course_id = ? AND class_date = ? AND present = 1 AND device_id = ? AND student_id <> ?`,
    [courseId, classDate, deviceId, studentId]
  );
  for (const { student_id: other } of others) {
    const [a, b] = [studentId, other].sort((x, y) => x - y);
    await SecurityEvent.raise({
      type: 'shared_device_checkin',
      severity: 'high',
      userId: studentId,
      otherUserId: other,
      timetableId,
      classDate,
      deviceId,
      ip: normalise(ip),
      details: { note: 'Two student accounts checked in to the same lecture from the same browser.' },
      dedupeKey: `shared:${a}:${b}:${timetableId}:${classDate}`,
    });

    const lectures = await get(
      `SELECT COUNT(DISTINCT timetable_id || '|' || class_date) AS n FROM security_events
       WHERE type = 'shared_device_checkin' AND user_id IN (?, ?) AND other_user_id IN (?, ?)`,
      [a, b, a, b]
    );
    if (lectures.n >= THRESHOLDS.buddyLectures) {
      await SecurityEvent.raise({
        type: 'buddy_pair',
        severity: 'high',
        userId: a,
        otherUserId: b,
        details: { lectures_shared: lectures.n, note: 'The same two students keep checking in from one device.' },
        dedupeKey: `buddy:${a}:${b}`,
      });
    }
  }
}

// After a successful sign-in by a student: a browser used by several accounts, and a new device.
async function afterStudentLogin({ userId, deviceId, ip }) {
  if (!deviceId) return;
  const known = await get(
    `SELECT COUNT(*) AS n FROM login_log WHERE user_id = ? AND device_id = ? AND success = 1 AND id < (SELECT MAX(id) FROM login_log WHERE user_id = ?)`,
    [userId, deviceId, userId]
  );
  if (known.n === 0) {
    await SecurityEvent.raise({
      type: 'new_device',
      severity: 'info',
      userId,
      deviceId,
      ip: normalise(ip),
      details: { note: 'First sign-in to this account from this browser.' },
      dedupeKey: `newdev:${userId}:${deviceId}`,
    });
  }

  const accounts = await get(
    `SELECT COUNT(DISTINCT l.user_id) AS n FROM login_log l JOIN users u ON u.id = l.user_id
     WHERE l.device_id = ? AND l.success = 1 AND u.role = 'student'
       AND l.logged_in_at >= datetime('now', '-24 hours')`,
    [deviceId]
  );
  if (accounts.n >= THRESHOLDS.manyAccountsPerDevice) {
    await SecurityEvent.raise({
      type: 'many_accounts_one_device',
      severity: 'high',
      userId,
      deviceId,
      ip: normalise(ip),
      details: { accounts_in_24h: accounts.n, note: 'Several student accounts were signed in from one browser.' },
      dedupeKey: `manyacc:${deviceId}:${day()}`,
    });
  }
}

// A newer sign-in ended this student's earlier sessions. Repeated often means the account
// is being passed around.
async function afterSessionReplaced({ userId, count }) {
  const today = await get(
    `SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND revoke_reason = 'replaced' AND date(revoked_at) = date('now')`,
    [userId]
  );
  if (today.n >= THRESHOLDS.sessionChurnPerDay) {
    await SecurityEvent.raise({
      type: 'account_sharing_suspected',
      severity: 'medium',
      userId,
      details: { sessions_replaced_today: today.n, note: 'This account was signed in again from elsewhere several times today.' },
      dedupeKey: `churn:${userId}:${day()}`,
    });
  }
}

async function afterFailedLogin({ userId, ip, deviceId }) {
  const recent = await get(
    `SELECT COUNT(*) AS n FROM login_log WHERE user_id = ? AND success = 0 AND logged_in_at >= datetime('now', '-1 hours')`,
    [userId]
  );
  if (recent.n >= THRESHOLDS.failedLogins) {
    await SecurityEvent.raise({
      type: 'failed_logins',
      severity: 'medium',
      userId,
      ip: normalise(ip),
      deviceId,
      details: { failures_last_hour: recent.n },
      dedupeKey: `failed:${userId}:${hour()}`,
    });
  }
}

async function onAccountLocked({ userId, ip, deviceId }) {
  await SecurityEvent.raise({
    type: 'account_locked',
    severity: 'medium',
    userId,
    ip: normalise(ip),
    deviceId,
    details: { note: 'Sign-in locked after repeated failures.' },
    dedupeKey: `locked:${userId}:${hour()}`,
  });
}

// Used by the detection step of the admin device list.
const sameBrowserAccounts = (deviceId) =>
  all(
    `SELECT DISTINCT u.id, u.name, u.student_id FROM login_log l JOIN users u ON u.id = l.user_id
     WHERE l.device_id = ? AND l.success = 1 ORDER BY u.name`,
    [deviceId]
  );

module.exports = {
  THRESHOLDS,
  checkCampus,
  raiseOffCampus,
  afterCheckIn,
  afterStudentLogin,
  afterSessionReplaced,
  afterFailedLogin,
  onAccountLocked,
  sameBrowserAccounts,
};
