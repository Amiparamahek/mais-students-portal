# MAIS Student Portal — Setup & Run Guide

This project has two parts:

- `server/` — Node.js + Express + SQLite backend (port **5001**)
- `client/` — React + Vite frontend (port **3000**, or the next free port)

The frontend sends `/api` requests to the backend through a Vite proxy, so **both must run at the same time**.

---

## 1. What you need installed

| Tool    | Version      | Check with        |
|---------|--------------|-------------------|
| Node.js | 18 or newer  | `node -v`         |
| npm     | comes with Node | `npm -v`       |

Install Node from https://nodejs.org (LTS version) if it is missing.

---

## 2. Install dependencies (first time only)

Open a terminal in the project folder:

```bash
cd /Users/bhargavthummar/Downloads/mais_student_portal/mais_student_portal_real
```

Install the backend packages:

```bash
cd server
npm install
cd ..
```

Install the frontend packages:

```bash
cd client
npm install
cd ..
```

---

## 3. Database (first time only)

The file `server/database.sqlite` already has the tables and demo data, so you can skip this step.

If you ever need a fresh database:

```bash
cd server
npm run migrate   # creates the tables
npm run seed      # adds demo users and sample data
cd ..
```

---

## 4. Run the project

You need **two terminals**.

**Terminal 1 — backend**

```bash
cd /Users/bhargavthummar/Downloads/mais_student_portal/mais_student_portal_real/server
npm start
```

You should see:

```
🚀 Server running on http://localhost:5001
✅ Connected to SQLite database at ./database.sqlite
```

**Terminal 2 — frontend**

```bash
cd /Users/bhargavthummar/Downloads/mais_student_portal/mais_student_portal_real/client
npm run dev
```

Vite prints the address, usually:

```
http://localhost:3000
```

If port 3000 is busy, Vite uses 3001 or the next free port. Use the address it prints.

Open that address in your browser.

---

## 5. Login (demo accounts)

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| Student | `student@tuke.sk` | `demo123` |
| Admin   | `admin@tuke.sk`   | `admin123`|

The login page already has the student email and password filled in. Just click **Sign in →**.

---

## 6. Troubleshooting

**Login gives "Internal server error" (HTTP 500)**
The backend process is old or was started without the correct environment. Stop it and start it again:

```bash
cd server
npm start
```

Stop the old one first with `Ctrl + C` in its terminal. Check that `server/.env` has `JWT_SECRET` set.

**Login page loads but the dashboard is empty or shows errors**
The backend is not running. Start it in Terminal 1 (step 4).

**"Port 5001 already in use"**
A backend is already running. Use that one. Do not start a second copy. To find it:

```bash
lsof -iTCP:5001 -sTCP:LISTEN -n -P
```

**"Port 3000 already in use"**
Vite will use the next free port. Use the address it prints, or stop the other app on port 3000.

**Changes in the code do not show**
Save the file, then refresh the browser. The Vite dev server reloads automatically.

**Want to stop everything**
Press `Ctrl + C` in both terminals.

---

## 7. Build for production (optional)

```bash
cd client
npm run build
```

This creates a `dist/` folder. It is not needed for the demo.

---

## 8. Important notes

- This is a demo system. Do not use real student data or real passwords.
- The "Forgot password?" link on the login page does nothing yet.
- The dashboard greeting ("Good afternoon, Mahek") is fixed text.
