// Feature tests. They call a RUNNING server, so start one first, ideally on a copy of the
// database (they create test students and attendance):
//
//   cp database.sqlite /tmp/mais-test.sqlite
//   PORT=5058 DB_PATH=/tmp/mais-test.sqlite node src/server.js
//   TEST_BASE=http://localhost:5058/api TEST_ADMIN_EMAIL=admin@tuke.sk TEST_ADMIN_PASSWORD=admin123 npm test
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.TEST_BASE || 'http://localhost:5001/api';
const ADMIN = { email: process.env.TEST_ADMIN_EMAIL || 'admin@tuke.sk', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' };
const stamp = Date.now().toString(36);

async function call(method, path, token, body, { raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return { status: res.status, type: res.headers.get('content-type'), text: await res.text() };
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function login(email, password) {
  const r = await call('POST', '/auth/login', null, { email, password });
  assert.equal(r.status, 200, `login failed for ${email}: ${JSON.stringify(r.data)}`);
  return r.data.token;
}

let admin;
let student; // { id, email, password, token }

before(async () => {
  admin = await login(ADMIN.email, ADMIN.password);
  // A fresh student for each run, so results do not depend on earlier runs.
  const email = `feat.${stamp}@tuke.sk`;
  const password = 'feature123';
  const created = await call('POST', '/admin/students', admin, {
    name: `Feature ${stamp}`,
    email,
    password,
    programme: 'Feature Testing',
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  student = { id: created.data.id, email, password, token: await login(email, password) };
});

test('CSV export: header, download type and formula-safe cells', async () => {
  // A student whose name is a spreadsheet formula must come out neutralised.
  const evil = await call('POST', '/admin/students', admin, {
    name: '=HYPERLINK("http://x","x")',
    email: `csv.${stamp}@tuke.sk`,
    password: 'feature123',
  });
  assert.equal(evil.status, 201);

  const res = await call('GET', '/reports/export/students', admin, null, { raw: true });
  assert.equal(res.status, 200);
  assert.match(res.type, /text\/csv/);
  const lines = res.text.replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(lines[0], 'name,email,student_id,programme,faculty,academic_year,study_status,status,created_at');
  assert.ok(lines.some((l) => l.startsWith(`"'=HYPERLINK`)), 'formula cell must be prefixed and quoted');
  assert.ok(lines.some((l) => l.includes(student.email)), 'the test student is exported');
});

test('CSV export: only admins, and unknown kinds are rejected', async () => {
  const asStudent = await call('GET', '/reports/export/students', student.token, null, { raw: true });
  assert.equal(asStudent.status, 403);
  const unknown = await call('GET', '/reports/export/passwords', admin, null, { raw: true });
  assert.equal(unknown.status, 404);
});

test('Results summary: a student sees their own classes and overall figures', async () => {
  const r = await call('GET', '/reports/my-results', student.token);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data.classes));
  assert.ok('attendance_percentage' in r.data.overall);
  assert.ok('grades_published' in r.data.overall);
  // A brand-new student is enrolled in nothing, so the summary is empty but valid.
  assert.equal(r.data.overall.classes, r.data.classes.length);
});

test('Low-attendance warning: sent once when attendance drops below 75%', async () => {
  // Enrol the test student in one class and mark it absent on three different days.
  const classes = await call('GET', '/courses', admin);
  const course = classes.data[0];
  await call('POST', '/courses/enroll', admin, { courseId: course.id, studentId: student.id });

  const days = ['2026-01-05', '2026-01-06', '2026-01-07'];
  for (const date of days) {
    const r = await call('POST', '/attendance', admin, {
      date,
      records: [{ student_id: student.id, course_id: course.id, present: false }],
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }

  const notes = await call('GET', '/notifications', student.token);
  const low = notes.data.filter((n) => n.title === 'Low attendance' && n.message.includes(course.code));
  assert.equal(low.length, 1, 'one warning for the class, not one per save');
  assert.match(low[0].message, /below 75%/);

  // Saving the same absences again must not add a second warning on the same day.
  await call('POST', '/attendance', admin, {
    date: days[2],
    records: [{ student_id: student.id, course_id: course.id, present: false }],
  });
  const again = await call('GET', '/notifications', student.token);
  assert.equal(again.data.filter((n) => n.title === 'Low attendance' && n.message.includes(course.code)).length, 1);
});

test('Programme-wise analysis lists each programme with its own figures', async () => {
  const r = await call('GET', '/admin/analysis', admin);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data.perProgramme));
  const mine = r.data.perProgramme.find((p) => p.programme === 'Feature Testing');
  assert.ok(mine, 'the test programme appears');
  assert.ok(mine.students >= 1);
  assert.ok(mine.held >= 3, 'the lectures recorded above are counted');
  assert.ok('at_risk' in mine && 'percentage' in mine);
});

test('Student IDs are never reused, even after a student is deleted', async () => {
  const seen = new Set();
  // Create, delete the newest, and create again: the new ID must be a fresh one.
  const a = await call('POST', '/admin/students', admin, { name: `Id A ${stamp}`, email: `ida.${stamp}@tuke.sk`, password: 'feature123' });
  assert.equal(a.status, 201);
  seen.add(a.data.student_id);
  const del = await call('DELETE', `/admin/students/${a.data.id}`, admin);
  assert.equal(del.status, 200);
  const b = await call('POST', '/admin/students', admin, { name: `Id B ${stamp}`, email: `idb.${stamp}@tuke.sk`, password: 'feature123' });
  assert.equal(b.status, 201);
  assert.ok(!seen.has(b.data.student_id), `ID ${b.data.student_id} was already used`);
  assert.ok(Number(b.data.student_id.slice(-4)) > Number(a.data.student_id.slice(-4)));
});

test('Soft delete: hidden from lists and sign-in, records kept, restore brings it back', async () => {
  const email = `soft.${stamp}@tuke.sk`;
  const made = await call('POST', '/admin/students', admin, { name: `Soft ${stamp}`, email, password: 'feature123' });
  const id = made.data.id;
  assert.equal((await login(email, 'feature123')).length > 10, true, 'can sign in before delete');

  await call('DELETE', `/admin/students/${id}`, admin);
  const list = await call('GET', '/admin/students', admin);
  assert.ok(!list.data.some((s) => s.id === id), 'deleted student is not in the list');
  const signIn = await call('POST', '/auth/login', null, { email, password: 'feature123' });
  assert.equal(signIn.status, 400, 'deleted account cannot sign in');

  // The record is still there for an admin to open.
  const profile = await call('GET', `/admin/students/${id}/profile`, admin);
  assert.equal(profile.status, 200);

  const back = await call('POST', `/admin/students/${id}/restore`, admin);
  assert.equal(back.status, 200);
  assert.equal((await login(email, 'feature123')).length > 10, true, 'can sign in again after restore');
});

test('Feature switches: switched-off features are refused by the server, and come back on', async () => {
  const before = await call('GET', '/settings', student.token);
  assert.equal(before.status, 200);
  assert.equal(typeof before.data.features.analysis, 'boolean');

  // Switch analysis and security off.
  const off = await call('PUT', '/admin/settings', admin, { features: { analysis: false, security: false, bogus: true } });
  assert.equal(off.status, 200);
  assert.equal(off.data.features.analysis, false);
  assert.equal(off.data.features.security, false);
  assert.ok(!('bogus' in off.data.features), 'unknown keys are ignored');

  const blocked = await call('GET', '/admin/analysis', admin);
  assert.equal(blocked.status, 503);
  assert.equal(blocked.data.feature, 'analysis');
  assert.equal((await call('GET', '/admin/security/summary', admin)).status, 503);
  assert.equal((await call('GET', '/reports/export/students', admin, null, { raw: true })).status, 503);

  // A student sees the switch state, so the menu can hide the page.
  const seen = await call('GET', '/settings', student.token);
  assert.equal(seen.data.features.analysis, false);

  // Back on.
  await call('PUT', '/admin/settings', admin, { features: { analysis: true, security: true } });
  assert.equal((await call('GET', '/admin/analysis', admin)).status, 200);
});

test('Feature switches: only admins can change them; server information is admin-only and hides secrets', async () => {
  const asStudent = await call('PUT', '/admin/settings', student.token, { features: { chat: false } });
  assert.equal(asStudent.status, 403);
  const info = await call('GET', '/admin/settings', admin);
  assert.equal(info.status, 200);
  assert.ok(info.data.server.node_version);
  assert.ok(!JSON.stringify(info.data).includes(process.env.JWT_SECRET || '__no_secret_in_env__'));
  assert.equal(info.data.server.jwt_secret, 'set (hidden)');
});

test('Requests: open, message with cooldown, digest notifications, and closing on outcome', async () => {
  const bad = await call('POST', '/requests', student.token, { category: 'nonsense', subject: 'Hi', message: 'Hello there' });
  assert.equal(bad.status, 400);

  const made = await call('POST', '/requests', student.token, {
    category: 'approval',
    subject: `Late registration ${stamp}`,
    message: 'Please approve my late registration for DB401.',
  });
  assert.equal(made.status, 201, JSON.stringify(made.data));
  const id = made.data.id;

  // Cooldown: a second student message right away is refused.
  const first = await call('POST', `/requests/${id}/messages`, student.token, { body: 'Following up on this.' });
  assert.equal(first.status, 429, 'student messages are limited to one a minute');

  // The student cannot read another student's thread.
  const other = await call('POST', '/admin/students', admin, { name: `Other ${stamp}`, email: `other.${stamp}@tuke.sk`, password: 'feature123' });
  const otherToken = await login(`other.${stamp}@tuke.sk`, 'feature123');
  assert.equal((await call('GET', `/requests/${id}`, otherToken)).status, 404);

  // Admin replies; the student gets one notification for the thread.
  const reply1 = await call('POST', `/requests/${id}/messages`, admin, { body: 'Checking with the department.' });
  assert.equal(reply1.status, 201);
  const reply2 = await call('POST', `/requests/${id}/messages`, admin, { body: 'Still checking.' });
  assert.equal(reply2.status, 201);
  const notes = (await call('GET', '/notifications', student.token)).data;
  const updates = notes.filter((n) => n.title === 'Request update' && n.message.includes(`Late registration ${stamp}`));
  assert.equal(updates.length, 1, 'two admin replies within 10 minutes give one notification');

  // Admin marks it approved: the thread closes, and an approval outcome is not valid for documents.
  const wrong = await call('POST', `/requests/${id}/status`, admin, { status: 'ready' });
  assert.equal(wrong.status, 400, 'outcome must match the request type');
  const done = await call('POST', `/requests/${id}/status`, admin, { status: 'approved', note: 'Approved. Register at the office.' });
  assert.equal(done.status, 200);
  const closedMsg = await call('POST', `/requests/${id}/messages`, student.token, { body: 'Thanks, one more question' });
  assert.equal(closedMsg.status, 400, 'no messages after the outcome');

  // Thread shows the full history including the status line.
  const t = await call('GET', `/requests/${id}`, student.token);
  assert.equal(t.data.request.status, 'approved');
  assert.ok(t.data.messages.some((m) => m.kind === 'status' && /Approved/.test(m.body)));
  assert.equal(other.status, 201);
});

test('Requests: admin summary counts open threads and unread student messages; switch off refuses', async () => {
  const q = await call('POST', '/requests', student.token, { category: 'question', subject: `Question ${stamp}`, message: 'Is there a make-up lecture?' });
  assert.equal(q.status, 201);
  const summ = await call('GET', '/requests/summary', admin);
  assert.equal(summ.status, 200);
  assert.ok(summ.data.unread >= 1, 'the new student message is unread for admin');
  await call('GET', `/requests/${q.data.id}`, admin); // admin opens it
  const after = await call('GET', '/requests/summary', admin);
  assert.equal(after.data.unread, summ.data.unread - 1);

  await call('PUT', '/admin/settings', admin, { features: { chat: false } });
  assert.equal((await call('GET', '/requests', student.token)).status, 503);
  await call('PUT', '/admin/settings', admin, { features: { chat: true } });
  assert.equal((await call('GET', '/requests', student.token)).status, 200);
});

test('Per-lecture attendance: two lectures of one class on one day are counted separately', async () => {
  const courses = await call('GET', '/courses', admin);
  const course = courses.data[1] || courses.data[0];
  const room = (k) => `PL-${k}-${stamp}`;
  const a = await call('POST', '/timetable', admin, { courseId: course.id, day: 'Monday', time: '08:00-08:50', room: room('A') });
  const b = await call('POST', '/timetable', admin, { courseId: course.id, day: 'Monday', time: '09:00-09:50', room: room('B') });
  assert.equal(a.status, 201, JSON.stringify(a.data));
  assert.equal(b.status, 201, JSON.stringify(b.data));

  const s = await call('POST', '/admin/students', admin, { name: `PL ${stamp}`, email: `pl.${stamp}@tuke.sk`, password: 'feature123' });
  await call('POST', '/courses/enroll', admin, { courseId: course.id, studentId: s.data.id });
  const before = (await call('GET', '/attendance/my-attendance', await login(`pl.${stamp}@tuke.sk`, 'feature123'))).data;
  const heldBefore = before.find((r) => r.course_id === course.id)?.classes_held ?? 0;

  const date = '2026-02-02';
  const save = await call('POST', '/attendance', admin, {
    date,
    records: [
      { student_id: s.data.id, course_id: course.id, timetable_id: a.data.id, present: true },
      { student_id: s.data.id, course_id: course.id, timetable_id: b.data.id, present: false },
    ],
  });
  assert.equal(save.status, 200, JSON.stringify(save.data));

  const lectures = await call('GET', `/teaching/classes/${course.id}/lectures`, admin);
  assert.ok(lectures.data.some((l) => l.id === a.data.id) && lectures.data.some((l) => l.id === b.data.id));
  const onlyA = await call('GET', `/teaching/classes/${course.id}/attendance?date=${date}&lecture=${a.data.id}`, admin);
  const onlyB = await call('GET', `/teaching/classes/${course.id}/attendance?date=${date}&lecture=${b.data.id}`, admin);
  assert.equal(onlyA.data.marks.find((m) => m.student_id === s.data.id).present, 1);
  assert.equal(onlyB.data.marks.find((m) => m.student_id === s.data.id).present, 0);

  const after = (await call('GET', '/attendance/my-attendance', await login(`pl.${stamp}@tuke.sk`, 'feature123'))).data;
  assert.equal(after.find((r) => r.course_id === course.id).classes_held, heldBefore + 2, 'both lectures counted');
  await call('DELETE', `/admin/students/${s.data.id}`, admin);
});

test('Self sign-up: off by default; when on, registration waits for admin approval, which gives the ID', async () => {
  const pub = await call('GET', '/settings/public', null);
  assert.equal(pub.status, 200);
  const email = `signup.${stamp}@tuke.sk`;
  const body = { name: `Signup ${stamp}`, email, password: 'signup1234', programme: 'Feature Testing' };

  // Make sure the switch is off for the first attempt.
  await call('PUT', '/admin/settings', admin, { features: { signup: false } });
  assert.equal((await call('POST', '/auth/register', null, body)).status, 403);

  await call('PUT', '/admin/settings', admin, { features: { signup: true } });
  const sent = await call('POST', '/auth/register', null, body);
  assert.equal(sent.status, 202, JSON.stringify(sent.data));
  assert.equal(sent.data.student_id, undefined, 'no ID before approval');

  const waiting = await call('POST', '/auth/login', null, { email, password: 'signup1234' });
  assert.equal(waiting.status, 403);
  assert.match(waiting.data.message, /waiting for approval/);

  const queue = await call('GET', '/admin/registrations', admin);
  const mine = queue.data.find((r) => r.email === email);
  assert.ok(mine, 'the registration is in the admin queue');

  const approved = await call('POST', `/admin/registrations/${mine.id}/approve`, admin);
  assert.equal(approved.status, 200, JSON.stringify(approved.data));
  assert.match(approved.data.student_id, /^MAIS-\d{4}-\d{4}$/);

  const token = await login(email, 'signup1234');
  const me = await call('GET', '/auth/me', token);
  assert.equal(me.data.user.student_id, approved.data.student_id);

  // A rejected registration cannot sign in.
  const other = `reject.${stamp}@tuke.sk`;
  await call('POST', '/auth/register', null, { ...body, email: other });
  const q2 = (await call('GET', '/admin/registrations', admin)).data.find((r) => r.email === other);
  assert.equal((await call('POST', `/admin/registrations/${q2.id}/reject`, admin)).status, 200);
  assert.equal((await call('POST', '/auth/login', null, { email: other, password: 'signup1234' })).status, 400);

  await call('PUT', '/admin/settings', admin, { features: { signup: false } });
});

test('Password reset: a one-time link from the outbox sets a new password and ends sessions', async () => {
  // The server must run with MAIL_MODE=file and MAIL_FILE=<path>; see README "Tests".
  const fs = require('node:fs');
  const outbox = process.env.MAIL_FILE;
  const email = `reset.${stamp}@tuke.sk`;
  const made = await call('POST', '/admin/students', admin, { name: `Reset ${stamp}`, email, password: 'reset1234' });
  const old = await login(email, 'reset1234');

  // Same answer whether or not the account exists.
  const unknown = await call('POST', '/auth/forgot', null, { email: `nobody.${stamp}@tuke.sk` });
  const known = await call('POST', '/auth/forgot', null, { email });
  assert.equal(unknown.data.message, known.data.message);

  if (!outbox || !fs.existsSync(outbox)) {
    // Without the file outbox the rest of this test cannot read the link.
    return;
  }
  const lines = fs.readFileSync(outbox, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const mail = lines.filter((m) => m.to === email).at(-1);
  assert.ok(mail, 'a reset link was sent');
  const token = new URL(mail.link).searchParams.get('token');

  assert.equal((await call('POST', '/auth/reset', null, { token: 'not-a-real-token', password: 'brand-new1' })).status, 400);
  const done = await call('POST', '/auth/reset', null, { token, password: 'brand-new1' });
  assert.equal(done.status, 200, JSON.stringify(done.data));
  assert.equal((await call('GET', '/auth/me', old)).status, 401, 'the old session ended');
  assert.equal((await call('POST', '/auth/reset', null, { token, password: 'brand-new2' })).status, 400, 'the link works once');
  assert.ok((await login(email, 'brand-new1')).length > 10, 'signs in with the new password');
  await call('DELETE', `/admin/students/${made.data.id}`, admin);
});

test('Live updates: a student\'s open stream gets an event as soon as a notification is created', async () => {
  const res = await fetch(BASE + '/events', { headers: { Authorization: `Bearer ${student.token}` } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  const readUntil = async (needle, ms = 8000) => {
    const end = Date.now() + ms;
    while (!text.includes(needle) && Date.now() < end) {
      const { value, done } = await Promise.race([reader.read(), new Promise((r) => setTimeout(() => r({ done: true }), 1000))]);
      if (value) text += decoder.decode(value, { stream: true });
      if (done) break;
    }
    return text.includes(needle);
  };
  assert.ok(await readUntil('"type":"hello"'), 'the stream opens');
  text = '';
  const post = await call('POST', '/announcements', admin, { title: `Live ${stamp}`, content: 'event check' });
  assert.equal(post.status, 201);
  assert.ok(await readUntil('"type":"notification"'), 'the student is told without reloading');
  await reader.cancel();
  await call('DELETE', `/announcements/${post.data.id}`, admin);
});
