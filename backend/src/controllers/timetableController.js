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
    const { courseId, day, time, room, week } = req.body;
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

module.exports = { getAll, create };
