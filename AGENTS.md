# MAIS Student Portal — agent notes

Two services must run at the same time; the frontend proxies `/api` to the backend.

## Ports
- Backend: `http://localhost:5001` (`backend/src/server.js`)
- Frontend: `http://localhost:3000` (`frontend/src/main.jsx`, Vite)
- Vite proxy: `/api` -> `http://localhost:5001` (`frontend/vite.config.js`)

## Run (two terminals)
Terminal 1 — backend:
```
cd backend
npm install        # first time; node_modules must be rebuilt per-OS (not copied from macOS)
npm run migrate    # create tables (first time / fresh DB)
npm run seed       # load demo users + sample data
npm start
```
Terminal 2 — frontend:
```
cd frontend
npm install
npm run dev
```

## Required env
`backend/.env` must exist before first run:
```
PORT=5001
JWT_SECRET=<random 64-character hex string; see backend/.env.example>
JWT_EXPIRES_IN=8h
DB_PATH=./database.sqlite
```
Backend loads it via `dotenv`; DB path defaults to `backend/database.sqlite`.

## Database
- SQLite file: `backend/database.sqlite`
- Schema: `backend/migrations/001_init.sql`
- Seed data: `backend/scripts/seed.js` (4 students + admin + courses/enrollments/grades/attendance/notifications)
- Demo accounts: `student@tuke.sk / demo123`, `admin@tuke.sk / admin123`
- Verify: `npm run db:check` | Export readable copy: `npm run db:export`
- To wipe and regenerate: delete `database.sqlite`, then `migrate` + `seed`.

## Backend scripts (`backend/package.json`)
- `start` — `node src/server.js`
- `dev` — `nodemon src/server.js`
- `migrate` — `node scripts/migrate.js`
- `seed` — `node scripts/seed.js`
- `db:check` — print table/row counts + users
- `db:export` — write `database-report.html` + `database_export/*.csv`

## Frontend scripts (`frontend/package.json`)
- `dev` — `vite` (port 3000)
- `build` — `vite build` -> `dist/`
- `preview` — `vite preview`

## Auth
- Frontend axios (`frontend/src/services/api.js`): `baseURL: '/api'`, sends `Bearer <token>` from `localStorage.token`; on 401 clears storage and redirects to `/login`.
- Backend auth middleware: `backend/src/middleware/auth.js` (`auth`, `adminOnly`); JWT signed with `JWT_SECRET`, expires `JWT_EXPIRES_IN`.

## Route-order gotcha (verified bug)
In `backend/src/routes/courses.js`, specific routes (`/enroll`, `/enroll/:courseId`, `/my-enrollments`) **must be declared before** `router.get('/:id', ...)`. Express matches `/:id` greedily, so `my-enrollments` would otherwise be treated as an id and 404.

## No test suite
There are no test, lint, typecheck, or CI scripts. Verification is manual: hit `http://localhost:5001/api/health` and log in via `http://localhost:3000`.
