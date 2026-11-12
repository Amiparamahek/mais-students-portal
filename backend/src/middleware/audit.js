const db = require('../config/database');

const SENSITIVE_KEY = /pass|token|secret/i;

// Copy of the request body that is safe to store: secrets removed, long values cut.
const scrub = (value, depth = 0) => {
  if (value == null || depth > 3) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '[hidden]' : scrub(v, depth + 1)])
    );
  }
  return typeof value === 'string' && value.length > 120 ? `${value.slice(0, 120)}...` : value;
};

// Writes one audit row for every successful change an admin makes.
// It runs for every request but only records once the response is finished.
function auditAdminWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  res.on('finish', () => {
    if (!req.user || req.user.role !== 'admin' || res.statusCode >= 400) return;
    const path = req.originalUrl.split('?')[0];
    if (path.startsWith('/api/auth')) return;
    db.run(
      'INSERT INTO audit_log (user_id, method, path, status, ip, detail) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.method, path, res.statusCode, req.ip, JSON.stringify(scrub(req.body)).slice(0, 500)],
      (err) => err && console.error('audit log failed:', err.message)
    );
  });
  next();
}

module.exports = auditAdminWrites;
