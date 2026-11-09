const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const { canManageCourse } = require('../utils/access');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// Lecturers see their own courses. Admins see all of them.
const getMyCourses = async (req, res) => {
  try {
    const courses = req.user.role === 'admin' ? await Course.getAll() : await Course.getByLecturer(req.user.id);
    res.json(courses);
  } catch (err) {
    fail(res, err);
  }
};

const getCourseStudents = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!(await canManageCourse(req.user, courseId))) {
      return res.status(403).json({ message: 'Not your course' });
    }
    res.json(await Enrollment.getByCourse(courseId));
  } catch (err) {
    fail(res, err);
  }
};

// Who was marked present on a given date, plus running totals for the course.
const getCourseAttendance = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!(await canManageCourse(req.user, courseId))) {
      return res.status(403).json({ message: 'Not your course' });
    }
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    res.json({
      date,
      marks: await Attendance.getLogForDate(courseId, date),
      totals: await Attendance.getTotalsForCourse(courseId),
    });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getMyCourses, getCourseStudents, getCourseAttendance };
