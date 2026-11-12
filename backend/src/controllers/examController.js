const Exam = require('../models/Exam');
const { notifyStudents } = require('../utils/notify');
const { HHMM_RE } = require('../utils/dates');

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
    const { courseId, examDate, room } = req.body;
    const examTime = req.body.examTime || req.body.exam_time || null;
    const examEndTime = req.body.examEndTime || req.body.exam_end_time || null;
    const examName = req.body.examName || req.body.exam_name || req.body.title;
    if (!courseId || !examName || !examDate) {
      return res.status(400).json({ message: 'Course, exam name, and date are required' });
    }
    if ((examTime && !HHMM_RE.test(examTime)) || (examEndTime && !HHMM_RE.test(examEndTime))) {
      return res.status(400).json({ message: 'Times must look like 09:00' });
    }
    if (examEndTime && !examTime) {
      return res.status(400).json({ message: 'Set a start time together with the end time' });
    }
    // "HH:MM" strings compare correctly as text.
    if (examTime && examEndTime && examEndTime <= examTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    const result = await Exam.create({ courseId, examName, examDate, examTime, examEndTime, room });
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
