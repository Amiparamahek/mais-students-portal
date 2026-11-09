const Grade = require('../models/Grade');

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
    res.status(201).json({ id: result.id, message: 'Grade created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyGrades, create };
