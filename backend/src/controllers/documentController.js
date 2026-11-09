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
    const { title, fileUrl, file_url, category } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const result = await Document.create({ title, fileUrl: fileUrl || file_url, category });
    res.status(201).json({ id: result.id, message: 'Document created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Document.remove(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create, remove };
