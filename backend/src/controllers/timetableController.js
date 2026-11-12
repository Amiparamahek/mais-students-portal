const Timetable = require('../models/Timetable');
const { notifyStudents } = require('../utils/notify');
const { WEEKDAYS, TIME_RE, slotsOverlap, slotMinutes } = require('../utils/dates');

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

const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Same building and room, compared without case. An empty room never counts as a clash.
const isSameRoom = (row, building, room) =>
  !!room &&
  (row.room || '').toLowerCase() === room.toLowerCase() &&
  (row.building || '').toLowerCase() === (building || '').toLowerCase();

const roomLabel = (building, room) =>
  [building && `Building ${building}`, room && `Room ${room}`].filter(Boolean).join(', ');

// Slots on the same day that overlap the given time.
const overlapping = async ({ day, time, excludeId }) => {
  const rows = await Timetable.sameDay(day, excludeId);
  return rows.filter((r) => slotsOverlap(r.time, time));
};

// Admin form: the classes already in this time window, and whether each one uses the same room.
const conflicts = async (req, res) => {
  try {
    const { day, time } = req.query;
    if (!WEEKDAYS.includes(day) || !TIME_RE.test(time || '')) {
      return res.status(400).json({ message: 'Day and time are required' });
    }
    const building = clean(req.query.building);
    const room = clean(req.query.room);
    const excludeId = Number(req.query.excludeId) || null;
    const rows = await overlapping({ day, time, excludeId });
    res.json(rows.map((r) => ({
      id: r.id,
      course_code: r.course_code,
      course_name: r.course_name,
      day: r.day,
      time: r.time,
      building: r.building,
      room: r.room,
      same_room: isSameRoom(r, building, room),
    })));
  } catch (err) {
    fail(res, err);
  }
};

// Returns a message if the slot would double-book a room, otherwise null.
const roomBookedBy = async ({ day, time, building, room, excludeId }) => {
  if (!room) return null;
  const clash = (await overlapping({ day, time, excludeId })).find((r) => isSameRoom(r, building, room));
  return clash ? `${roomLabel(building, room)} is already booked at this time for ${clash.course_code}` : null;
};

const validSlot = ({ day, time }) => {
  if (!WEEKDAYS.includes(day)) return 'Day must be a weekday name, e.g. Monday';
  if (!TIME_RE.test(time || '')) return 'Time must look like 09:00-10:30';
  const [start, end] = slotMinutes(time);
  if (end <= start) return 'End time must be after start time';
  return null;
};

const create = async (req, res) => {
  try {
    const courseId = req.body.courseId || req.body.course_id;
    const { day, time, week } = req.body;
    const building = clean(req.body.building);
    const room = clean(req.body.room);
    if (!courseId) return res.status(400).json({ message: 'Class is required' });
    const problem = validSlot({ day, time });
    if (problem) return res.status(400).json({ message: problem });
    const booked = await roomBookedBy({ day, time, building, room });
    if (booked) return res.status(409).json({ message: booked });
    const result = await Timetable.create({ courseId, day, time, building, room, week });
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
    const existing = await Timetable.get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Timetable entry not found' });
    const merged = {
      day: req.body.day ?? existing.day,
      time: req.body.time ?? existing.time,
      building: 'building' in req.body ? clean(req.body.building) : existing.building,
      room: 'room' in req.body ? clean(req.body.room) : existing.room,
    };
    const booked = await roomBookedBy({ ...merged, excludeId: existing.id });
    if (booked) return res.status(409).json({ message: booked });
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

module.exports = { getAll, create, update, remove, conflicts };
