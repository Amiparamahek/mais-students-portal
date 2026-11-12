const Course = require('../models/Course');
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
      marks: await Attendance.getLogForDate(courseId, date),
      totals: await Attendance.getTotalsForCourse(courseId),
    });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getClasses, getClassStudents, getClassAttendance };
