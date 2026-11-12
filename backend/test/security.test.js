// Security rules, checked against a RUNNING server (see README "Tests" for how to start one
// on a copy of the database). Creates and removes its own test accounts.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const BASE = process.env.TEST_BASE || 'http://localhost:5001/api';
const ADMIN = { email: process.env.TEST_ADMIN_EMAIL || 'admin@tuke.sk', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' };
const stamp = Date.now().toString(36);

async function call(method, path_, token, body, device) {
  const res = await fetch(BASE + path_, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(device ? { 'X-Device-Id': device } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}
const signIn = (email, password, device) => call('POST', '/auth/login', null, { email, password }, device);
const me = (token) => call('GET', '/auth/me', token);

let admin;
const PASSWORD = 'secure123';
before(async () => {
  const r = await signIn(ADMIN.email, ADMIN.password);
  assert.equal(r.status, 200);
  admin = r.data.token;
});

async function newStudent(tag) {
  const email = `sec.${tag}.${stamp}@tuke.sk`;
  const r = await call('POST', '/admin/students', admin, { name: `Sec ${tag}`, email, password: PASSWORD });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return { id: r.data.id, email };
}

test('Security headers and CORS: sensible defaults, unknown origins get no CORS header', async () => {
  const res = await call('GET', '/health', null);
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('content-security-policy'));
  const evil = await fetch(BASE + '/health', { headers: { Origin: 'https://evil.example' } });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
});

test('Health check reports the database as ok', async () => {
  const res = await call('GET', '/health', null);
  assert.equal(res.status, 200);
  assert.equal(res.data.database, 'ok');
});

test('Passwords: weak ones are refused on sign-up', async () => {
  const weak = await call('POST', '/auth/register', null, { name: 'W', email: `w.${stamp}@tuke.sk`, password: 'abc' });
  assert.equal(weak.status, 400);
  const noDigit = await call('POST', '/auth/register', null, { name: 'W', email: `w2.${stamp}@tuke.sk`, password: 'abcdefgh' });
  assert.equal(noDigit.status, 400);
});

test('Lockout: five wrong passwords lock the account; the correct one is then refused', async () => {
  const s = await newStudent('lock');
  for (let i = 0; i < 5; i++) await signIn(s.email, 'wrong-password-' + i);
  const locked = await signIn(s.email, PASSWORD);
  assert.equal(locked.status, 429);
  await call('DELETE', `/admin/students/${s.id}`, admin);
});

test('One session per student: a second sign-in ends the first, with the reason', async () => {
  const s = await newStudent('one');
  const first = (await signIn(s.email, PASSWORD, 'device-a')).data.token;
  assert.equal((await me(first)).status, 200);
  const second = (await signIn(s.email, PASSWORD, 'device-b')).data.token;
  const ended = await me(first);
  assert.equal(ended.status, 401);
  assert.equal(ended.data.reason, 'replaced');
  assert.equal((await me(second)).status, 200);
  await call('DELETE', `/admin/students/${s.id}`, admin);
});

test('Sign-out, deactivation and reset end the session at once', async () => {
  const s = await newStudent('end');
  const t1 = (await signIn(s.email, PASSWORD)).data.token;
  assert.equal((await call('POST', '/auth/logout', t1)).status, 200);
  assert.equal((await me(t1)).status, 401);

  const t2 = (await signIn(s.email, PASSWORD)).data.token;
  await call('PUT', `/admin/students/${s.id}/toggle-active`, admin, { is_active: 0 });
  assert.equal((await me(t2)).status, 401);
  assert.equal((await signIn(s.email, PASSWORD)).status, 403, 'deactivated accounts cannot sign in');
  await call('PUT', `/admin/students/${s.id}/toggle-active`, admin, { is_active: 1 });

  const t3 = (await signIn(s.email, PASSWORD)).data.token;
  await call('POST', `/admin/students/${s.id}/reset-password`, admin);
  assert.equal((await me(t3)).status, 401, 'a reset ends existing sessions');
  await call('DELETE', `/admin/students/${s.id}`, admin);
});

test('A token that has no session (issued before sessions existed) is refused', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const forged = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ id: 1, role: 'admin', exp: 9999999999 })}.invalid`;
  assert.equal((await me(forged)).status, 401);
});

test('Server refuses to start with a published or short JWT_SECRET', () => {
  const server = path.join(__dirname, '..', 'src', 'server.js');
  const run = (secret) =>
    spawnSync(process.execPath, [server], {
      env: { ...process.env, JWT_SECRET: secret, PORT: '5099' },
      encoding: 'utf8',
      timeout: 15000,
    });
  const published = run('mais_student_portal_secret_key_2026');
  assert.notEqual(published.status, 0);
  assert.match(published.stderr + published.stdout, /published or placeholder/);
  const short = run('short');
  assert.notEqual(short.status, 0);
  assert.match(short.stderr + short.stdout, /at least 32 characters/);
});
