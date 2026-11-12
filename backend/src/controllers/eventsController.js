const { bus } = require('../utils/events');
const Session = require('../models/Session');

const PING_MS = 25000;

// Server-sent events: one long-lived response per open page. Each event tells the page
// that something changed; the page then re-reads its own data.
const stream = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stop nginx from holding the stream back
  });
  res.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);

  const channels = [`u:${req.user.id}`];
  if (req.user.role === 'admin') channels.push('admins');
  const onEvent = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  channels.forEach((c) => bus.on(c, onEvent));

  // Keep the connection alive, and end it if the session was revoked meanwhile.
  const timer = setInterval(async () => {
    try {
      const active = await Session.findActive(req.user.sid);
      if (!active) {
        res.write(`data: ${JSON.stringify({ type: 'signed_out' })}\n\n`);
        return res.end();
      }
      res.write(': ping\n\n');
    } catch (_) {
      res.end();
    }
  }, PING_MS);

  req.on('close', () => {
    clearInterval(timer);
    channels.forEach((c) => bus.off(c, onEvent));
  });
};

module.exports = { stream };
