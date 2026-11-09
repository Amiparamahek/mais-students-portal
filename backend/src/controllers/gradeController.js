const Grade = require('../models/Grade');
const { notifyStudents } = require('../utils/notify');

const getMyGrades = async (req, res) => {
  try {
    const grades = await Grade.getByStudent(req.user.id);
    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { studentId, courseId, assessment, grade, status } = req.body;
    if (!studentId || !courseId || !assessment || !grade) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const result = await Grade.create({ studentId, courseId, assessment, grade, status });
    if ((status || 'published') === 'published') {
      await notifyStudents('New grade published', `${assessment}: ${grade}`, studentId);
    }
    res.status(201).json({ id: result.id, message: 'Grade created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAll = async (req, res) => {
  try {
    res.json(await Grade.getAll());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await Grade.remove(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyGrades, create, getAll, remove };
