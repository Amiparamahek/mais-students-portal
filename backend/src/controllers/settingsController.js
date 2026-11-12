const os = require('os');
const path = require('path');
const { getFeatures, saveFeatures, LABELS, DEFAULTS } = require('../utils/features');
const settings = require('../utils/settings');

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// Any signed-in user can read the switches, so the menus can hide what is off.
const getPublic = async (req, res) => {
  try {
    res.json({ features: await getFeatures() });
  } catch (err) {
    fail(res, err);
  }
};

// Admin view: switches plus read-only server information. Secrets are never shown.
const getAdmin = async (req, res) => {
  try {
    const cfg = settings.get();
    res.json({
      features: await getFeatures(),
      labels: LABELS,
      defaults: DEFAULTS,
      server: {
        node_version: process.version,
        environment: cfg.nodeEnv || 'development',
        platform: `${os.platform()} ${os.release()}`,
        uptime_hours: Math.round((process.uptime() / 3600) * 10) / 10,
        database_file: path.basename(process.env.DB_PATH || 'database.sqlite'),
        cors_origins: cfg.corsOrigins,
        trust_proxy: String(cfg.trustProxy),
        campus_ip_ranges: cfg.campusRanges,
        off_campus_checkin: cfg.checkinOffCampus,
        session_length: process.env.JWT_EXPIRES_IN || '8h',
        jwt_secret: 'set (hidden)',
      },
    });
  } catch (err) {
    fail(res, err);
  }
};

const putFeatures = async (req, res) => {
  try {
    const updates = req.body?.features;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'Send { "features": { "chat": true, ... } }' });
    }
    res.json({ features: await saveFeatures(updates, req.user.id), message: 'Settings saved' });
  } catch (err) {
    fail(res, err);
  }
};

// Before sign-in, the login page only needs to know whether self sign-up is on.
const getSignupSwitch = async (req, res) => {
  try {
    res.json({ signup: (await getFeatures()).signup });
  } catch (err) {
    fail(res, err);
  }
};

module.exports = { getPublic, getAdmin, putFeatures, getSignupSwitch };
