const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Document = require('../models/Document');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
];

// Files are stored under random names; the original name is kept in the database only.
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('File type not allowed (PDF, Word, PowerPoint, Excel, text or image)'), { status: 400 }));
  },
}).single('file');

const fail = (res, err) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
};

const getAll = async (req, res) => {
  try {
    res.json(await Document.getVisible({ id: req.user.id, role: req.user.role }));
  } catch (err) {
    fail(res, err);
  }
};

// Admin uploads a file (multipart) or saves a link. Optionally attached to one class.
const create = (req, res) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) return fail(res, uploadErr);
    try {
      const body = req.body;
      const title = (body.title || '').trim();
      if (!title) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: 'Title is required' });
      }
      const link = body.fileUrl || body.file_url || null;
      if (!req.file && !link) {
        return res.status(400).json({ message: 'Choose a file or enter a link' });
      }
      const result = await Document.create({
        title,
        category: body.category || null,
        courseId: body.courseId || body.course_id || null,
        fileUrl: req.file ? null : link,
        storedName: req.file?.filename,
        originalName: req.file?.originalname,
        mimeType: req.file?.mimetype,
        sizeBytes: req.file?.size,
      });
      res.status(201).json({ id: result.id, message: 'Document created' });
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      fail(res, err);
    }
  });
};

// Streams a stored file, but only to users who can see the document.
const download = async (req, res) => {
  try {
    const doc = await Document.get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!(await Document.canAccess(req.user, doc))) {
      return res.status(403).json({ message: 'You do not have access to this document' });
    }
    if (doc.stored_name) {
      const filePath = path.join(UPLOAD_DIR, path.basename(doc.stored_name));
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File is missing on the server' });
      return res.download(filePath, doc.original_name || doc.title);
    }
    if (doc.file_url) return res.json({ url: doc.file_url });
    return res.status(404).json({ message: 'This document has no file attached' });
  } catch (err) {
    fail(res, err);
  }
};

const remove = async (req, res) => {
  try {
    const doc = await Document.get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    await Document.remove(req.params.id);
    if (doc.stored_name) fs.unlink(path.join(UPLOAD_DIR, path.basename(doc.stored_name)), () => {});
    res.json({ message: 'Document deleted' });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getAll, create, download, remove };
