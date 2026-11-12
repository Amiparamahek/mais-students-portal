const db = require('../config/database');
const SecurityEvent = require('../models/SecurityEvent');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const summary = async (req, res) => {
  try {
    res.json(await SecurityEvent.summary());
  } catch (err) {
    fail(res, err);
  }
};

const events = async (req, res) => {
  try {
    const status = ['open', 'reviewed', 'dismissed', 'all'].includes(req.query.status) ? req.query.status : 'open';
    res.json(await SecurityEvent.list({ status, limit: req.query.limit }));
  } catch (err) {
    fail(res, err);
  }
};

// Review or dismiss a flag. A note is required, so every decision explains itself.
const review = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "reviewed" or "dismissed"' });
    }
    if (typeof note !== 'string' || note.trim().length < 3) {
      return res.status(400).json({ message: 'Add a short note explaining the decision' });
    }
    const event = await SecurityEvent.get(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await SecurityEvent.review(req.params.id, { status, note: note.trim().slice(0, 500), reviewerId: req.user.id });
    res.json({ message: `Event ${status}` });
  } catch (err) {
    fail(res, err);
  }
};

const audit = (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  db.all(
    `SELECT a.id, a.method, a.path, a.status, a.ip, a.detail, a.created_at, u.name AS admin_name
     FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.id DESC LIMIT ?`,
    [limit],
    (err, rows) => (err ? fail(res, err) : res.json(rows))
  );
};

module.exports = { summary, events, review, audit };
