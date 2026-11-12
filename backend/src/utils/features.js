// Feature switches. Set by an admin on the Settings page and stored in app_settings.
// Enforced on the server: a switched-off feature refuses requests even if called directly.
const db = require('../config/database');

const DEFAULTS = {
  chat: true, // student requests and admin replies
  checkin: true, // students checking in to lectures
  security: true, // security flags and their page
  analysis: true, // analysis page and CSV exports
  signup: false, // students may register themselves; an admin approves and gives the ID
};
const LABELS = {
  chat: 'Chat and requests',
  checkin: 'Self check-in to lectures',
  security: 'Security flags',
  analysis: 'Analysis and CSV exports',
  signup: 'Student self sign-up (needs admin approval)',
};
const KEYS = Object.keys(DEFAULTS);

const readStored = () =>
  new Promise((resolve, reject) =>
    db.get("SELECT value FROM app_settings WHERE key = 'features'", (err, row) => {
      if (err) return reject(err);
      try {
        resolve(row ? JSON.parse(row.value) : {});
      } catch (_) {
        resolve({});
      }
    })
  );

// Current switch positions. Anything not stored falls back to the default (on).
async function getFeatures() {
  const stored = await readStored();
  return Object.fromEntries(KEYS.map((k) => [k, typeof stored[k] === 'boolean' ? stored[k] : DEFAULTS[k]]));
}

// Only known feature keys with boolean values are accepted.
function saveFeatures(updates, userId) {
  return getFeatures().then((current) => {
    const next = { ...current };
    for (const [key, value] of Object.entries(updates || {})) {
      if (KEYS.includes(key) && typeof value === 'boolean') next[key] = value;
    }
    return new Promise((resolve, reject) =>
      db.run(
        `INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES ('features', ?, CURRENT_TIMESTAMP, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by`,
        [JSON.stringify(next), userId],
        (err) => (err ? reject(err) : resolve(next))
      )
    );
  });
}

// Route guard: refuses with 503 when the feature is switched off.
function requireFeature(name) {
  return async (req, res, next) => {
    try {
      const features = await getFeatures();
      if (features[name]) return next();
      res.status(503).json({ message: `${LABELS[name]} is switched off by the administrator.`, feature: name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

module.exports = { DEFAULTS, LABELS, KEYS, getFeatures, saveFeatures, requireFeature };
