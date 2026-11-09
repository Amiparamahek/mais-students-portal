const User = require('../models/User');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');

const getAccounts = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecords = async (req, res) => {
  try {
    const users = await User.getAll();
    const courses = await Course.getAll();
    res.json({ users, courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const result = await Announcement.create({ title, content, createdBy: req.user.id });
    res.status(201).json({ id: result.id, message: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, faculty, programme, academic_year, role } = req.body;
    const result = await User.update(id, { name, email, student_id, faculty, programme, academic_year, role });
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await User.delete(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle student active status
const toggleStudentActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const result = await User.toggleActive(id, is_active);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: `Student ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get students enrolled in a course
const getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const students = await Enrollment.getByCourse(id);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Attendance report per course
const getAttendanceReport = async (req, res) => {
  try {
    const report = await Attendance.getReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAccounts,
  getCourses,
  getRecords,
  createAnnouncement,
  updateStudent,
  deleteStudent,
  toggleStudentActive,
  getCourseStudents,
  getAttendanceReport,
};
