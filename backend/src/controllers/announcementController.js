const Announcement = require('../models/Announcement');
const { notifyStudents } = require('../utils/notify');

const getAll = async (req, res) => {
  try {
    const announcements = await Announcement.getAll();
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { title, content, isPublished } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const result = await Announcement.create({ title, content, createdBy: req.user.id, isPublished });
    await notifyStudents('New announcement', title);
    res.status(201).json({ id: result.id, message: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const result = await Announcement.update(id, fields);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Announcement.delete(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
