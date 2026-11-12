# Deploying the MAIS portal

One Node process serves both the API and the website.

## 1. Requirements
- Node.js 20 or newer
- A server with HTTPS (a reverse proxy such as Caddy or nginx in front of port 5001)

## 2. Configure (`backend/.env`, never committed)
Copy `backend/.env.example` and set:

| Setting | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 64 random hex characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CORS_ORIGINS` | your site address, e.g. `https://portal.example.edu` |
| `TRUST_PROXY` | `1` when behind one reverse proxy |
| `CAMPUS_IP_RANGES` | the campus network, e.g. `10.20.0.0/16` |
| `CHECKIN_OFF_CAMPUS` | `flag` or `block` |
| `SERVE_FRONTEND` | `true` (serve the website from this process) |
| `PUBLIC_URL` | `https://portal.example.edu` (used in reset links) |
| `MAIL_MODE` | `off` until a mail provider is added (reset links are then not sent) |

Demo accounts are not shown in production (`VITE_SHOW_DEMO_ACCOUNTS` is unset).

## 3. Build and start
```bash
cd frontend && npm ci && npm run build
cd ../backend && npm ci --omit=dev
npm run migrate            # first time only; safe to re-run
npm start
```
Check: `curl https://portal.example.edu/api/health` should show `"database": "ok"`.

## 4. Backups
```bash
npm run backup             # writes backend/backups/mais-<time>.sqlite, keeps the newest 14
```
Run it daily (cron) and copy `backend/backups/` off the server. To restore, stop the server, replace `database.sqlite` with a backup, and start again.

## 5. Updating
Stop, take a backup, `git pull`, repeat step 3. Migrations only add tables and columns; they never delete data.

## 6. Known limits before real use
- Mail: no provider is connected. Connect one in `backend/src/utils/mailer.js` before relying on password reset.
- Dependency audit: `sqlite3` has known install-time advisories (`npm audit`). Plan an upgrade and test it.
