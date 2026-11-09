const Timetable = require('../models/Timetable');
const { notifyStudents } = require('../utils/notify');
const { WEEKDAYS, TIME_RE } = require('../utils/dates');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// Admin sees the whole timetable. A student sees only the classes they are enrolled in.
const getAll = async (req, res) => {
  try {
    res.json(await Timetable.getVisible({ id: req.user.id, role: req.user.role }));
  } catch (err) {
    fail(res, err);
  }
};

const validSlot = ({ day, time }) => {
  if (!WEEKDAYS.includes(day)) return 'Day must be a weekday name, e.g. Monday';
  if (!TIME_RE.test(time || '')) return 'Time must look like 09:00-10:30';
  return null;
};

const create = async (req, res) => {
  try {
    const courseId = req.body.courseId || req.body.course_id;
    const { day, time, room, week } = req.body;
    if (!courseId) return res.status(400).json({ message: 'Class is required' });
    const problem = validSlot({ day, time });
    if (problem) return res.status(400).json({ message: problem });
    const result = await Timetable.create({ courseId, day, time, room, week });
    await notifyStudents('Timetable updated', `New class added on ${day} at ${time}.`);
    res.status(201).json({ id: result.id, message: 'Timetable entry created' });
  } catch (err) {
    fail(res, err);
  }
};

const update = async (req, res) => {
  try {
    if (req.body.day !== undefined || req.body.time !== undefined) {
      const problem = validSlot({ day: req.body.day, time: req.body.time });
      if (problem) return res.status(400).json({ message: problem });
    }
    const result = await Timetable.update(req.params.id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    await notifyStudents('Timetable updated', 'A class in your timetable was changed.');
    res.json({ message: 'Timetable entry updated' });
  } catch (err) {
    fail(res, err);
  }
};

const remove = async (req, res) => {
  try {
    const result = await Timetable.remove(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getAll, create, update, remove };
