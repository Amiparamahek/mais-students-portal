const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const { toISODate } = require('../utils/dates');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Per-date record of the student's own classes.
const getMyLog = async (req, res) => {
  try {
    res.json(await Attendance.getStudentLog(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    res.json(await Attendance.getByStudent(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admins and lecturers mark attendance for one class date.
// Body: { date: 'YYYY-MM-DD', records: [{ student_id, course_id, present }] }
const createOrUpdate = async (req, res) => {
  try {
    if (!Array.isArray(req.body.records)) {
      return res.status(400).json({ message: 'records array is required' });
    }
    const classDate = req.body.date || toISODate();
    if (!DATE_RE.test(classDate)) {
      return res.status(400).json({ message: 'Date must be YYYY-MM-DD' });
    }

    for (const r of req.body.records) {
      const studentId = Number(r.student_id ?? r.studentId);
      const courseId = Number(r.course_id ?? r.courseId);
      if (!(await Enrollment.isEnrolled(studentId, courseId))) {
        return res.status(400).json({ message: `Student ${studentId} is not enrolled in course ${courseId}` });
      }
      await Attendance.recordClass({
        studentId,
        courseId,
        classDate,
        present: !!r.present,
        recordedBy: req.user.id,
      });
    }
    res.json({ message: 'Attendance saved successfully', date: classDate, count: req.body.records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyAttendance, getMyLog, createOrUpdate };
