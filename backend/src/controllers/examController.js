const Exam = require('../models/Exam');
const { notifyStudents } = require('../utils/notify');

const getAll = async (req, res) => {
  try {
    const exams = await Exam.getVisible({ id: req.user.id, role: req.user.role });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { courseId, examDate, examTime, room } = req.body;
    const examName = req.body.examName || req.body.exam_name || req.body.title;
    if (!courseId || !examName || !examDate) {
      return res.status(400).json({ message: 'Course, exam name, and date are required' });
    }
    const result = await Exam.create({ courseId, examName, examDate, examTime, room });
    await notifyStudents('Exam scheduled', `${examName} on ${examDate}.`);
    res.status(201).json({ id: result.id, message: 'Exam created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await Exam.remove(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create, remove };
