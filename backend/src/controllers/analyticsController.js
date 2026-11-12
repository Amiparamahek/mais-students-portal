const Analytics = require('../models/Analytics');
const { finalizeEndedSessions } = require('../utils/sessions');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const getStudentProfile = async (req, res) => {
  try {
    await finalizeEndedSessions();
    const profile = await Analytics.studentProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: 'Student not found' });
    res.json(profile);
  } catch (err) {
    fail(res, err);
  }
};

const getOverview = async (req, res) => {
  try {
    await finalizeEndedSessions();
    res.json(await Analytics.overview());
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getStudentProfile, getOverview };
