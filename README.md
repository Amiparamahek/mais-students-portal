# MAIS Student Portal

MAIS Student Portal is a full-stack student management system with a React frontend and a Node.js/Express + SQLite backend.

## Project Structure

```
mais_student_portal/
├── README.md
├── SETUP.md
├── frontend/          # React + Vite frontend (port 3000)
└── backend/           # Node.js + Express + SQLite backend (port 5001)
```

## Frontend

React 18 + Vite application located in `frontend/`.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will print the URL (usually `http://localhost:3000`).

## Backend

Node.js + Express + SQLite API located in `backend/`.

### Run the backend

```bash
cd backend
npm install
npm run migrate   # create tables (first time only)
npm run seed      # load demo users and sample data (first time only)
npm start
```

The server runs on `http://localhost:5001`.

### Environment variables

Create `backend/.env` before first run:

```env
PORT=5001
JWT_SECRET=<random 64-character hex string; see backend/.env.example>
JWT_EXPIRES_IN=8h
DB_PATH=./database.sqlite
```

## Demo Accounts

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| Student | student@tuke.sk   | demo123   |
| Admin   | admin@tuke.sk     | admin123  |

## Important Notes

- This is a demo/prototype system. Do not use real student data or real passwords.
- See `SETUP.md` for detailed setup and troubleshooting instructions.