const Course = require('../models/Course');
const db = require('../config/database');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const { toISODate } = require('../utils/dates');
const { finalizeEndedSessions } = require('../utils/sessions');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// Admin teaches the classes, so the teaching views list every class.
const getClasses = async (req, res) => {
  try {
    res.json(await Course.getAll());
  } catch (err) {
    fail(res, err);
  }
};

// The lectures (timetable slots) of one class, for the admin marking page.
const getClassLectures = async (req, res) => {
  try {
    res.json(await all(
      `SELECT t.id, t.day, t.time, t.room, t.building FROM timetable t WHERE t.course_id = ?
       ORDER BY CASE t.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END, t.time`,
      [Number(req.params.id)]
    ));
  } catch (err) {
    fail(res, err);
  }
};

const getClassStudents = async (req, res) => {
  try {
    res.json(await Enrollment.getByCourse(Number(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
};

// Who was marked present on a date, plus running totals for the class.
const getClassAttendance = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    await finalizeEndedSessions();
    const date = req.query.date || toISODate();
    res.json({
      date,
      marks: await Attendance.getLogForDate(courseId, date, Number(req.query.lecture) || null),
      totals: await Attendance.getTotalsForCourse(courseId),
    });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getClasses, getClassStudents, getClassAttendance, getClassLectures };
