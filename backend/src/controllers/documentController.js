const Document = require('../models/Document');

const getAll = async (req, res) => {
  try {
    const documents = await Document.getAll();
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { title, fileUrl, category } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const result = await Document.create({ title, fileUrl, category });
    res.status(201).json({ id: result.id, message: 'Document created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create };
