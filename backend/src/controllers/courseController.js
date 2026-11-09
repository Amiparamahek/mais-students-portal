const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const getAll = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, credits, lecturer, semester, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'Code and name are required' });
    }
    const result = await Course.create({ code, name, credits, lecturer, semester, description });
    res.status(201).json({ id: result.id, message: 'Course created' });
  } catch (err) {
    console.error(err);
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const result = await Course.update(id, fields);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Course.delete(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const enroll = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    const isEnrolled = await Enrollment.isEnrolled(studentId, courseId);
    if (isEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const result = await Enrollment.enroll(studentId, courseId);
    if (result.changes === 0) {
      return res.status(400).json({ message: 'Enrollment failed' });
    }

    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const unenroll = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const result = await Enrollment.unenroll(studentId, courseId);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.getByStudent(req.user.id);
    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, remove, enroll, unenroll, getMyEnrollments };
