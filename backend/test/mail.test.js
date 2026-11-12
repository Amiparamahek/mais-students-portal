// Mail settings are read when the module loads, so each case loads it fresh.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MAILER = require.resolve('../src/utils/mailer');
function load(env) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  delete require.cache[MAILER];
  return require(MAILER);
}
const mail = { to: 'a@tuke.sk', name: 'A', link: 'https://portal/reset?token=x' };

test('mail off: nothing is sent and the caller is told why', async () => {
  const m = load({ MAIL_MODE: 'off' });
  const r = await m.sendPasswordReset(mail);
  assert.equal(r.sent, false);
  assert.equal(r.reason, 'off');
});

test('mail file: each message is written as one JSON line', async () => {
  const file = path.join(os.tmpdir(), `mail-${Date.now()}.jsonl`);
  const m = load({ MAIL_MODE: 'file', MAIL_FILE: file });
  const r = await m.sendPasswordReset(mail);
  assert.equal(r.sent, true);
  const line = JSON.parse(fs.readFileSync(file, 'utf8').trim());
  assert.equal(line.to, mail.to);
  fs.unlinkSync(file);
});

test('mail smtp without settings: refused cleanly, no crash', async () => {
  const m = load({ MAIL_MODE: 'smtp', SMTP_HOST: undefined, MAIL_FROM: undefined });
  const r = await m.sendPasswordReset(mail);
  assert.equal(r.sent, false);
  assert.equal(r.reason, 'not configured');
});

test('mail smtp with an unreachable server: reports failure, does not throw', async () => {
  const m = load({ MAIL_MODE: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', MAIL_FROM: 'portal@tuke.sk' });
  const r = await m.sendPasswordReset(mail);
  assert.equal(r.sent, false);
  assert.equal(r.reason, 'send failed');
});
