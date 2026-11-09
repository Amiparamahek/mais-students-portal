const User = require('../models/User');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const { notifyStudents } = require('../utils/notify');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const { hashPassword } = require('../utils/auth');

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
    await notifyStudents('New announcement', title);
    res.status(201).json({ id: result.id, message: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Student management ----------

const getStudents = async (req, res) => {
  try {
    const students = await User.getStudents();
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, role, student_id, faculty, programme, academic_year } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await hashPassword(password || 'demo123');
    const result = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'student',
      studentId: student_id,
      faculty,
      programme,
      academicYear: academic_year,
    });

    res.status(201).json({ id: result.id, message: 'Student created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, faculty, programme, academic_year, role } = req.body;
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (email !== undefined) fields.email = email;
    if (student_id !== undefined) fields.student_id = student_id;
    if (faculty !== undefined) fields.faculty = faculty;
    if (programme !== undefined) fields.programme = programme;
    if (academic_year !== undefined) fields.academic_year = academic_year;
    if (role !== undefined) fields.role = role;
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const result = await User.update(id, fields);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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

const getStudentCourses = async (req, res) => {
  try {
    const courses = await Enrollment.getByStudent(req.params.id);
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Course management ----------

const getCourseStudents = async (req, res) => {
  try {
    const students = await Enrollment.getByCourse(req.params.id);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Attendance ----------

const getAttendanceReport = async (req, res) => {
  try {
    const report = await Attendance.getReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Dashboard stats ----------

const getDashboardStats = async (req, res) => {
  try {
    const students = await User.getStudents();
    const courses = await Course.getAll();
    const announcements = await Announcement.getAll ? await Announcement.getAll() : [];
    const report = await Attendance.getReport();
    res.json({
      totalStudents: students.length,
      totalCourses: courses.length,
      totalAnnouncements: Array.isArray(announcements) ? announcements.length : 0,
      attendanceReport: report,
    });
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
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentActive,
  getStudentCourses,
  getCourseStudents,
  getAttendanceReport,
  getDashboardStats,
};
