const { notifyStudents } = require('../utils/notify');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const getAll = async (req, res) => {
  try {
    res.json(await Course.getAll());
  } catch (err) {
    fail(res, err);
  }
};

// Students search the catalog by code or name. Results include seats and whether they are enrolled.
const search = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : -1;
    res.json(await Course.search(req.query.q || '', studentId));
  } catch (err) {
    fail(res, err);
  }
};

const getById = async (req, res) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    fail(res, err);
  }
};

const create = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'Code and name are required' });
    }
    const result = await Course.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ id: result.id, message: 'Course created' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    fail(res, err);
  }
};

const update = async (req, res) => {
  try {
    const result = await Course.update(req.params.id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course updated' });
  } catch (err) {
    fail(res, err);
  }
};

const remove = async (req, res) => {
  try {
    const result = await Course.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    fail(res, err);
  }
};

// Registration rules: the course must exist, the student must not already be enrolled,
// seats must be free, and any prerequisite must have a published grade.
const enroll = async (req, res) => {
  try {
    if (req.user.role === 'lecturer') {
      return res.status(403).json({ message: 'Lecturers cannot enrol in courses' });
    }
    const { courseId } = req.body;
    const studentId = req.user.role === 'admin' && req.body.studentId ? Number(req.body.studentId) : req.user.id;

    const course = await Course.getById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (await Enrollment.isEnrolled(studentId, courseId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    if (course.seats != null && (await Enrollment.countActive(courseId)) >= course.seats) {
      return res.status(409).json({ message: `${course.code} is full (${course.seats} seats)` });
    }
    if (course.prerequisite_course_id && !(await Enrollment.hasPublishedGrade(studentId, course.prerequisite_course_id))) {
      return res.status(400).json({
        message: `Prerequisite not met: ${course.prerequisite_code || 'the prerequisite course'} must have a published grade first`,
      });
    }

    const result = await Enrollment.enroll(studentId, courseId);
    if (result.changes === 0) {
      return res.status(400).json({ message: 'Enrollment failed' });
    }
    if (req.user.role === 'admin') {
      await notifyStudents('Enrolled in a class', `You were added to ${course.code} ${course.name}.`, studentId);
    }
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err) {
    fail(res, err);
  }
};

const unenroll = async (req, res) => {
  try {
    const studentId = req.user.role === 'admin' && req.body?.studentId ? Number(req.body.studentId) : req.user.id;
    const result = await Enrollment.unenroll(studentId, req.params.courseId);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json({ message: 'Unenrolled' });
  } catch (err) {
    fail(res, err);
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    res.json(await Enrollment.getByStudent(req.user.id));
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getAll, search, getById, create, update, remove, enroll, unenroll, getMyEnrollments };
