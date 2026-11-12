// Automatic attendance for timetable slots.
//
// A class window opens CHECKIN_BEFORE_MIN minutes before the start and closes at the end.
// Students check themselves in during the window. When a window closes, every enrolled
// student without a record for that date is recorded as absent, once.
const db = require('../config/database');
const Attendance = require('../models/Attendance');
const { toISODate, weekdayOf, slotMinutes } = require('./dates');

const CHECKIN_BEFORE_MIN = 15;
const LOOKBACK_DAYS = 7;

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, (err) => (err ? reject(err) : resolve())));

const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// 'upcoming' | 'open' | 'closed' for a slot on a given date.
function windowState(slotTime, date, now) {
  const dayStr = toISODate(date);
  const today = toISODate(now);
  if (dayStr < today) return 'closed';
  if (dayStr > today) return 'upcoming';
  const [start, end] = slotMinutes(slotTime);
  const n = minutesOf(now);
  if (n >= end) return 'closed';
  if (n >= start - CHECKIN_BEFORE_MIN) return 'open';
  return 'upcoming';
}

// Records absences for slots whose window has closed. Slots without created_on (rows from
// before this feature) are skipped, so old history is never rewritten.
async function finalizeEndedSessions(now = new Date()) {
  for (let back = LOOKBACK_DAYS; back >= 0; back--) {
    const date = new Date(now);
    date.setDate(date.getDate() - back);
    const dayStr = toISODate(date);
    const slots = await all(
      'SELECT id, course_id, day, time, created_on FROM timetable WHERE day = ? AND created_on IS NOT NULL',
      [weekdayOf(date)]
    );
    for (const slot of slots) {
      if (dayStr < slot.created_on) continue; // slot was added after that day
      if (windowState(slot.time, date, now) !== 'closed') continue;
      // Attendance is recorded per class per date. Wait while another slot of the same class
      // on this day is still open, so the open lecture can still be checked in to.
      const others = await all(
        'SELECT time FROM timetable WHERE course_id = ? AND day = ? AND id <> ?',
        [slot.course_id, slot.day || weekdayOf(date), slot.id]
      );
      if (others.some((o) => windowState(o.time, date, now) !== 'closed')) continue;
      const done = await get('SELECT 1 FROM class_sessions WHERE timetable_id = ? AND class_date = ?', [slot.id, dayStr]);
      if (done) continue;

      const students = await all(
        `SELECT student_id FROM enrollments
         WHERE course_id = ? AND status = 'enrolled' AND date(enrolled_at) <= ?`,
        [slot.course_id, dayStr]
      );
      for (const { student_id } of students) {
        const has = await get(
          'SELECT 1 FROM attendance_log WHERE student_id = ? AND course_id = ? AND class_date = ?',
          [student_id, slot.course_id, dayStr]
        );
        if (!has) {
          await Attendance.recordClass({ studentId: student_id, courseId: slot.course_id, classDate: dayStr, present: false, recordedBy: null });
        }
      }
      await run('INSERT OR IGNORE INTO class_sessions (timetable_id, class_date) VALUES (?, ?)', [slot.id, dayStr]);
    }
  }
}

// Today's lectures for one student, with what they can do right now.
async function todayForStudent(studentId, now = new Date()) {
  await finalizeEndedSessions(now);
  const dayStr = toISODate(now);
  const slots = await all(
    `SELECT t.id, t.course_id, t.day, t.time, t.room, t.building, c.code, c.name
     FROM timetable t
     JOIN courses c ON c.id = t.course_id
     JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = ? AND e.status = 'enrolled'
     WHERE t.day = ?
     ORDER BY t.time`,
    [studentId, weekdayOf(now)]
  );
  const lectures = [];
  for (const s of slots) {
    const mark = await get(
      'SELECT present FROM attendance_log WHERE student_id = ? AND course_id = ? AND class_date = ?',
      [studentId, s.course_id, dayStr]
    );
    const state = windowState(s.time, now, now);
    const [start] = slotMinutes(s.time);
    let status;
    if (mark) status = mark.present ? 'present' : 'absent';
    else if (state === 'open') status = 'open';
    else if (state === 'closed') status = 'missed';
    else status = 'upcoming';
    lectures.push({
      timetable_id: s.id,
      course_id: s.course_id,
      course_code: s.code,
      course_name: s.name,
      time: s.time,
      room: s.room,
      building: s.building,
      opens_at: hhmm(start - CHECKIN_BEFORE_MIN),
      status,
      can_check_in: status === 'open',
    });
  }
  return { date: dayStr, now: hhmm(minutesOf(now)), lectures };
}

class CheckInError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// A student checks in to a lecture that is open now, for their own enrolled class.
async function checkIn(studentId, timetableId, now = new Date()) {
  const slot = await get(
    `SELECT t.id, t.course_id, t.day, t.time, c.code
     FROM timetable t JOIN courses c ON c.id = t.course_id WHERE t.id = ?`,
    [timetableId]
  );
  if (!slot) throw new CheckInError(404, 'Lecture not found');
  const enrolled = await get(
    "SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'enrolled'",
    [studentId, slot.course_id]
  );
  if (!enrolled) throw new CheckInError(403, 'You are not enrolled in this class');
  if (slot.day !== weekdayOf(now)) throw new CheckInError(400, `This lecture is on ${slot.day}`);

  const dayStr = toISODate(now);
  const state = windowState(slot.time, now, now);
  if (state === 'upcoming') {
    const [start] = slotMinutes(slot.time);
    throw new CheckInError(400, `Check-in opens at ${hhmm(start - CHECKIN_BEFORE_MIN)}`);
  }
  if (state === 'closed') throw new CheckInError(400, 'This class has ended');

  const mark = await get(
    'SELECT present FROM attendance_log WHERE student_id = ? AND course_id = ? AND class_date = ?',
    [studentId, slot.course_id, dayStr]
  );
  if (mark) return { status: mark.present ? 'present' : 'absent', already: true, course_code: slot.code };

  await Attendance.recordClass({ studentId, courseId: slot.course_id, classDate: dayStr, present: true, recordedBy: studentId });
  return { status: 'present', already: false, course_code: slot.code };
}

module.exports = { finalizeEndedSessions, todayForStudent, checkIn, CheckInError, CHECKIN_BEFORE_MIN, windowState };
