// Validated settings. Called once at start-up; a bad configuration stops the server
// instead of running with a secret anyone can find in the repository.
const KNOWN_WEAK_SECRETS = new Set([
  'mais_student_portal_secret_key_2026', // printed in the old README/AGENTS.md
  'secret',
  'changeme',
  'change-me',
]);

const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Express "trust proxy": 'false', 'true', a hop count, or a subnet name/list.
const parseTrustProxy = (v) => {
  if (v === undefined || v === '' || v === 'false') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
};

function loadConfig(env = process.env) {
  const problems = [];
  const secret = env.JWT_SECRET || '';
  if (!secret) problems.push('JWT_SECRET is not set');
  else if (secret.length < 32) problems.push('JWT_SECRET must be at least 32 characters');
  else if (KNOWN_WEAK_SECRETS.has(secret) || /^REPLACE/i.test(secret)) {
    problems.push('JWT_SECRET is a published or placeholder value; generate a new random one');
  }

  const offCampus = (env.CHECKIN_OFF_CAMPUS || 'flag').toLowerCase();
  if (!['flag', 'block'].includes(offCampus)) problems.push('CHECKIN_OFF_CAMPUS must be "flag" or "block"');

  if (problems.length) {
    const err = new Error(`Invalid configuration:\n - ${problems.join('\n - ')}\nSee backend/.env.example.`);
    err.isConfigError = true;
    throw err;
  }

  return {
    nodeEnv: env.NODE_ENV || 'development',
    corsOrigins: list(env.CORS_ORIGINS, 'http://localhost:3000,http://127.0.0.1:3000'),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    campusRanges: list(env.CAMPUS_IP_RANGES, ''),
    checkinOffCampus: offCampus,
  };
}

module.exports = { loadConfig, KNOWN_WEAK_SECRETS };
