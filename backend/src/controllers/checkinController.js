const { todayForStudent, checkIn, CheckInError } = require('../utils/sessions');

const fail = (res, err) => {
  if (err instanceof CheckInError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const getToday = async (req, res) => {
  try {
    res.json(await todayForStudent(req.user.id));
  } catch (err) {
    fail(res, err);
  }
};

const postCheckIn = async (req, res) => {
  try {
    const deviceId = (req.headers['x-device-id'] || '').toString().slice(0, 64) || null;
    const result = await checkIn(req.user.id, Number(req.body.timetableId), new Date(), { deviceId, ip: req.ip });
    res.status(result.already ? 200 : 201).json({
      ...result,
      message: result.already ? 'Already recorded for today' : `Checked in to ${result.course_code}`,
    });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getToday, postCheckIn };
