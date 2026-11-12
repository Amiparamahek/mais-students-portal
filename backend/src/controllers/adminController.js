const db = require('../config/database');
const User = require('../models/User');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const { notifyStudents } = require('../utils/notify');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const { hashPassword } = require('../utils/auth');
const Session = require('../models/Session');
const { nextStudentId } = require('../utils/studentIds');
const { validateEmail, validateName, validatePassword, generateTempPassword } = require('../utils/validate');

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

// Gives a student or lecturer a new temporary password. It is shown once, to the admin.
const resetStudentPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin passwords cannot be reset here' });
    }
    const temporaryPassword = generateTempPassword();
    await User.updatePassword(user.id, await hashPassword(temporaryPassword));
    await Session.revokeAll(user.id, 'password');
    res.json({ temporaryPassword, message: 'Password reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, role, faculty, programme, academic_year } = req.body;
    const problem = validateName(name) || validateEmail(email) || (password ? validatePassword(password) : null);
    if (problem) {
      return res.status(400).json({ message: problem });
    }
    const student_id = req.body.student_id?.trim() || (await nextStudentId());
    if (role && role !== 'student') {
      return res.status(400).json({ message: 'Only student accounts can be created here' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // No password given: make a one-time temporary one and show it to the admin once.
    const temporaryPassword = password ? null : generateTempPassword();
    const passwordHash = await hashPassword(password || temporaryPassword);
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

    res.status(201).json({ id: result.id, student_id, temporaryPassword, message: 'Student created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, faculty, programme, academic_year, role } = req.body;
    const problem =
      (name !== undefined ? validateName(name) : null) ||
      (email !== undefined ? validateEmail(email) : null) ||
      (role !== undefined && role !== 'student' ? 'Only student accounts can be edited here' : null);
    if (problem) {
      return res.status(400).json({ message: problem });
    }
    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (email !== undefined) fields.email = email.trim();
    if (student_id !== undefined) fields.student_id = student_id;
    if (faculty !== undefined) fields.faculty = faculty;
    if (programme !== undefined) fields.programme = programme;
    if (academic_year !== undefined) fields.academic_year = academic_year;
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

// Students who were deleted (soft), so an admin can restore one.
const getDeletedStudents = async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) =>
      db.all(
        `SELECT id, name, email, student_id, programme, deleted_at FROM users
         WHERE role = 'student' AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        (err, r) => (err ? reject(err) : resolve(r))
      )
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const restoreStudent = async (req, res) => {
  try {
    const result = await User.restore(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Deleted student not found' });
    res.json({ message: 'Student restored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete: the account is hidden and cannot sign in, but its records and ID stay.
    const result = await User.softDelete(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await Session.revokeAll(id, 'deactivated');
    res.json({ message: 'Student deleted (their records and student ID are kept)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sessions of one account, for the admin: where and when it was signed in.
const getStudentSessions = async (req, res) => {
  try {
    res.json(await Session.listForUser(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ends every active session of an account (for example a shared password).
const endStudentSessions = async (req, res) => {
  try {
    const result = await Session.revokeAll(req.params.id, 'admin');
    res.json({ message: `Ended ${result.changes} active session(s)`, ended: result.changes });
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
    if (!is_active) {
      await Session.revokeAll(id, 'deactivated');
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
  resetStudentPassword,
  getCourses,
  getRecords,
  createAnnouncement,
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getDeletedStudents,
  toggleStudentActive,
  getStudentSessions,
  endStudentSessions,
  getStudentCourses,
  getCourseStudents,
  getAttendanceReport,
  getDashboardStats,
};
