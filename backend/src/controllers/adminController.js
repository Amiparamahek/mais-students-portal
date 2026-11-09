const User = require('../models/User');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');

const getAccounts = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecords = async (req, res) => {
  try {
    const users = await User.getAll();
    const courses = await Course.getAll();
    res.json({ users, courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const result = await Announcement.create({ title, content, createdBy: req.user.id });
    res.status(201).json({ id: result.id, message: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAccounts, getCourses, getRecords, createAnnouncement };
