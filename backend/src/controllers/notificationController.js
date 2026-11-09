const Notification = require('../models/Notification');

const getByUser = async (req, res) => {
  try {
    const notifications = await Notification.getByUser(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ message: 'User, title, and message are required' });
    }
    const result = await Notification.create({ userId, title, message });
    res.status(201).json({ id: result.id, message: 'Notification created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Notification.markAsRead(id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read', changes: result.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getByUser, getUnreadCount, create, markAsRead, markAllAsRead };
