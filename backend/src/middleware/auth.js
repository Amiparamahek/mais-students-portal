const { verifyToken } = require('../utils/auth');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Admins and lecturers. Lecturers are further limited to their own courses by the controller.
const staffOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
};

module.exports = { auth, adminOnly, staffOnly };
