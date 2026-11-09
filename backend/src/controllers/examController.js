const Exam = require('../models/Exam');

const getAll = async (req, res) => {
  try {
    const exams = await Exam.getAll();
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { courseId, examName, examDate, examTime, room } = req.body;
    if (!courseId || !examName || !examDate) {
      return res.status(400).json({ message: 'Course, exam name, and date are required' });
    }
    const result = await Exam.create({ courseId, examName, examDate, examTime, room });
    res.status(201).json({ id: result.id, message: 'Exam created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create };
