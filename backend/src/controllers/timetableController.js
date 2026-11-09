const Timetable = require('../models/Timetable');

const getAll = async (req, res) => {
  try {
    const timetable = await Timetable.getAll();
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const courseId = req.body.courseId || req.body.course_id;
    const { day, time, room, week } = req.body;
    if (!courseId || !day || !time) {
      return res.status(400).json({ message: 'Course, day, and time are required' });
    }
    const result = await Timetable.create({ courseId, day, time, room, week });
    res.status(201).json({ id: result.id, message: 'Timetable entry created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const result = await Timetable.update(id, fields);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ message: 'Timetable entry updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Timetable.remove(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
