const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../utils/auth');

// Rate-limit key: the signed-in user when there is a valid token, otherwise the address.
// On a campus network many students share one public address, so limiting by address
// alone would block honest users; per-user keys avoid that.
const userOrIp = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      return `u:${verifyToken(header.slice(7)).id}`;
    } catch (_) {
      /* fall through to the address */
    }
  }
  return `ip:${req.ip}`;
};

const limiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ message: options.message || 'Too many requests. Please slow down.' }),
    ...options,
  });

function applySecurity(app, config) {
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet());

  // Only the configured front-end origins get CORS headers. Requests with no Origin
  // (curl, server-to-server) are unaffected; browsers on other sites are refused.
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    })
  );
}

// Order matters: the specific limiters are registered before the general one.
const limits = {
  // Failures only. The per-account lockout in the login handler does the precise work.
  login: limiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    skipSuccessfulRequests: true,
    message: 'Too many failed sign-in attempts from this network. Try again later.',
  }),
  register: limiter({ windowMs: 60 * 60 * 1000, limit: 20, message: 'Too many sign-up attempts. Try again later.' }),
  checkIn: limiter({ windowMs: 60 * 1000, limit: 30, keyGenerator: userOrIp, message: 'Too many check-in attempts. Wait a minute.' }),
  api: limiter({
    windowMs: 60 * 1000,
    // The live-refresh pages poll every few seconds, so signed-in users get generous room.
    limit: (req) => (userOrIp(req).startsWith('u:') ? 600 : 120),
    keyGenerator: userOrIp,
  }),
};

module.exports = { applySecurity, limits, userOrIp };
