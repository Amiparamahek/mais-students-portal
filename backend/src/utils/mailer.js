// Sends the password-reset link. Modes (MAIL_MODE):
//   smtp - send through an SMTP server (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM)
//   file - append each message as one JSON line to MAIL_FILE (used by the tests)
//   log  - write the link to the server log (development only)
//   off  - send nothing and say so (the default in production)
// The link is never returned in an HTTP response.
const MODE = (process.env.MAIL_MODE || (process.env.NODE_ENV === 'production' ? 'off' : 'log')).toLowerCase();

let transport = null;
function smtpTransport() {
  if (!transport) {
    const nodemailer = require('nodemailer');
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }
  return transport;
}

async function sendPasswordReset({ to, name, link }) {
  const text = `Hello ${name},\n\nYou asked to reset your MAIS portal password. Open this link within 30 minutes to choose a new password:\n\n${link}\n\nIf you did not ask for this, ignore this message.`;
  if (MODE === 'log') {
    console.log(`[mail:dev] password reset for ${to} (${name}): ${link}`);
    return { sent: true, mode: 'log' };
  }
  if (MODE === 'file') {
    require('fs').appendFileSync(process.env.MAIL_FILE || 'mail-outbox.jsonl', JSON.stringify({ to, name, link, at: new Date().toISOString() }) + '\n');
    return { sent: true, mode: 'file' };
  }
  if (MODE === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
      console.warn('[mail] MAIL_MODE=smtp but SMTP_HOST or MAIL_FROM is missing; nothing sent');
      return { sent: false, mode: 'smtp', reason: 'not configured' };
    }
    try {
      await smtpTransport().sendMail({ from: process.env.MAIL_FROM, to, subject: 'Reset your MAIS portal password', text });
      return { sent: true, mode: 'smtp' };
    } catch (err) {
      console.error('[mail] SMTP send failed:', err.message);
      return { sent: false, mode: 'smtp', reason: 'send failed' };
    }
  }
  console.warn(`[mail] not sent to ${to}: no mail provider is configured (MAIL_MODE=${MODE})`);
  return { sent: false, mode: MODE, reason: 'off' };
}

module.exports = { sendPasswordReset, MODE };
