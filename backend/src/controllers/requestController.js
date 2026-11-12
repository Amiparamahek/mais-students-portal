const Request = require('../models/Request');
const { CATEGORIES, LIMITS, allowedStatuses } = require('../utils/requests');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const categories = (req, res) => res.json(Object.entries(CATEGORIES).map(([key, c]) => ({ key, label: c.label, outcomes: c.outcomes })));

// Student opens a request with a first message. Limits keep it from becoming noise.
const create = async (req, res) => {
  try {
    const category = req.body.category;
    const subject = clean(req.body.subject, LIMITS.subjectMax);
    const body = clean(req.body.message, LIMITS.bodyMax);
    if (!CATEGORIES[category]) return res.status(400).json({ message: 'Choose a request type' });
    if (subject.length < 3) return res.status(400).json({ message: 'Subject must be at least 3 characters' });
    if (body.length < 5) return res.status(400).json({ message: 'Write a short message (at least 5 characters)' });

    const counts = await Request.counts(req.user.id);
    if (counts.open >= LIMITS.openPerStudent) {
      return res.status(429).json({ message: `You already have ${LIMITS.openPerStudent} open requests. Wait for a reply before opening more.` });
    }
    if (counts.today >= LIMITS.createdPerDay) {
      return res.status(429).json({ message: 'You have opened too many requests today. Try again tomorrow.' });
    }
    const id = await Request.create({ studentId: req.user.id, category, subject, body });
    res.status(201).json({ id, message: 'Request sent. The administration will reply in this thread.' });
  } catch (err) {
    fail(res, err);
  }
};

const list = async (req, res) => {
  try {
    const rows = await Request.list({
      viewerRole: req.user.role,
      viewerId: req.user.id,
      status: req.query.status,
      category: req.query.category,
      unreadOnly: req.query.unread === '1',
    });
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
};

// Opens a thread. Only its student and admins may see it; reading marks it seen for the viewer.
const thread = async (req, res) => {
  try {
    const r = await Request.get(req.params.id);
    if (!r) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role !== 'admin' && r.student_id !== req.user.id) {
      return res.status(404).json({ message: 'Request not found' });
    }
    await Request.markRead(r.id, req.user.role === 'admin' ? 'admin' : 'student');
    const messages = await Request.messages(r.id);
    res.json({
      request: { ...r, outcomes: CATEGORIES[r.category].outcomes, category_label: CATEGORIES[r.category].label },
      messages,
    });
  } catch (err) {
    fail(res, err);
  }
};

const addMessage = async (req, res) => {
  try {
    const r = await Request.get(req.params.id);
    if (!r) return res.status(404).json({ message: 'Request not found' });
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && r.student_id !== req.user.id) return res.status(404).json({ message: 'Request not found' });
    if (r.status !== 'open') {
      return res.status(400).json({ message: 'This request is closed. Open a new request if you need more help.' });
    }
    const body = clean(req.body.body, LIMITS.bodyMax);
    if (body.length < 1) return res.status(400).json({ message: 'Write a message first' });

    if (!isAdmin) {
      const since = await Request.secondsSinceStudentMessage(r.id);
      if (since !== null && since < LIMITS.studentMessageCooldownSec) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(LIMITS.studentMessageCooldownSec - since)} seconds. The administration reads the thread and will reply here.`,
        });
      }
    }

    await Request.addMessage(r.id, { senderId: req.user.id, senderRole: isAdmin ? 'admin' : 'student', body });
    if (isAdmin) {
      await Request.notifyDigest(r, `New reply on your request "${r.subject}".`, LIMITS.notifyDigestMinutes);
    }
    await Request.markRead(r.id, isAdmin ? 'admin' : 'student');
    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    fail(res, err);
  }
};

// Admin sets the outcome (approved, ready, resolved...) or reopens or closes a thread.
const setStatus = async (req, res) => {
  try {
    const r = await Request.get(req.params.id);
    if (!r) return res.status(404).json({ message: 'Request not found' });
    const status = req.body.status;
    if (!allowedStatuses(r.category).includes(status)) {
      return res.status(400).json({ message: `For this request type use: ${allowedStatuses(r.category).join(', ')}` });
    }
    const note = clean(req.body.note, LIMITS.bodyMax);
    await Request.setStatus(r.id, status);
    const text = note || `Status changed to ${status}.`;
    await Request.addMessage(r.id, { senderId: req.user.id, senderRole: 'admin', kind: 'status', body: text });
    await Request.notifyDigest(r, `Your request "${r.subject}" is now ${status}.`, LIMITS.notifyDigestMinutes);
    res.json({ message: `Request ${status}` });
  } catch (err) {
    fail(res, err);
  }
};

const summary = async (req, res) => {
  try {
    res.json(await Request.summary());
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { categories, create, list, thread, addMessage, setStatus, summary };
