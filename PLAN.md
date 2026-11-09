# MAIS Student Portal — Development Plan

**Goal:** Build a complete Admin + Student portal where the **Admin controls all students, classes, attendance, and more**, with secure **Admin login**.

**Stack:** Node.js + Express + SQLite (backend) | React + Vite + React Router (frontend) | JWT auth

---

## 1. Current State Assessment

### ✅ Already Built (Backend)
| Area | Status |
|------|--------|
| Auth (login/register, JWT) | Done |
| Users (students + admins) | Done |
| Courses (CRUD + enroll/unenroll) | Done |
| Grades | Done |
| Attendance (student view + admin mark) | Done |
| Timetable | Done |
| Exams | Done |
| Announcements | Done |
| Documents | Done |
| Notifications | Done |
| Admin routes (accounts, courses, records, announcements) | Partially done |
| DB migrations + seed | Done |

### ❌ Missing / To Build
| Area | Status |
|------|--------|
| Frontend React app (`src/`) | **Empty** — needs full build |
| Admin dashboard UI | Not built |
| Student dashboard UI | Not built |
| Admin class management UI | Not built |
| Admin attendance marking UI | Not built |
| Admin student list + control UI | Not built |
| Protected routes (role-based) | Not built on frontend |

---

## 2. Role-Based Access Plan

| Feature | Admin | Student |
|---------|-------|---------|
| Login | ✅ Required | ✅ Required |
| View own profile | ✅ | ✅ |
| View all students | ✅ | ❌ |
| Edit/delete any student | ✅ | ❌ |
| Create/update/delete courses | ✅ | ❌ |
| Enroll students in courses | ✅ | ❌ (self-enroll optional) |
| Mark attendance | ✅ | ❌ (view only) |
| View own attendance | ✅ | ✅ |
| View timetable | ✅ | ✅ |
| View grades | ✅ | ✅ (own only) |
| View announcements | ✅ | ✅ |
| Create announcements | ✅ | ❌ |
| View documents | ✅ | ✅ |
| Upload documents | ✅ | ❌ |

---

## 3. Admin Side — Features & Screens

### A. Admin Login (`/admin/login`)
- Email + password
- JWT stored in `localStorage`
- Redirect to `/admin/dashboard` on success
- Only users with `role = 'admin'` can access

### B. Admin Dashboard (`/admin/dashboard`)
- Stats cards: total students, total courses, attendance %, announcements
- Quick actions: Manage Students, Manage Classes, Mark Attendance, Send Announcement
- Recent activity list

### C. Manage Students (`/admin/students`)
- Table of all students (name, email, student_id, faculty, programme, year, status)
- Add new student
- Edit student details
- Delete student
- Reset student password
- View student's enrolled courses

### D. Manage Classes / Courses (`/admin/classes`)
- List all courses (code, name, credits, lecturer, semester)
- Add new course
- Edit course
- Delete course
- Assign lecturer
- View enrolled students per course
- Enroll / unenroll students from a course

### E. Mark Attendance (`/admin/attendance`)
- Select course + date
- List students enrolled in that course
- Mark Present / Absent for each student
- Save attendance (classes_held + classes_attended)
- View attendance report per course

### F. Timetable (`/admin/timetable`)
- Add class schedule (course, day, time, room, week)
- View weekly timetable grid
- Edit / delete slots

### G. Announcements (`/admin/announcements`)
- Create announcement (title, content)
- Publish to all students
- Edit / delete announcements

### H. Documents (`/admin/documents`)
- Upload document (title, file, category)
- List all documents
- Delete document

---

## 4. Student Side — Features & Screens

### A. Student Login (`/login`)
- Email + password
- JWT stored in `localStorage`
- Redirect to `/student/dashboard`

### B. Student Dashboard (`/student/dashboard`)
- Welcome message
- My enrolled courses (list with progress)
- My attendance % (per course)
- My grades (recent)
- Upcoming timetable (today's classes)
- Latest announcements

### C. My Courses (`/student/courses`)
- List of enrolled courses
- Course details (lecturer, credits, semester)
- Link to view attendance & grades for each course

### D. My Attendance (`/student/attendance`)
- Attendance per course (classes held, attended, %)
- Warning if attendance is low

### E. My Grades (`/student/grades`)
- Grades per course per assessment
- Overall GPA / percentage

### F. My Timetable (`/student/timetable`)
- Weekly class schedule
- Day, time, room, course

### G. Announcements (`/student/announcements`)
- List of published announcements
- Mark as read

### H. Documents (`/student/documents`)
- List of available documents
- Download files

### I. Profile (`/student/profile`)
- View own details
- Edit profile (password, contact)

---

## 5. Database Schema — Additions Needed

Current schema covers most needs. Suggested additions:

```sql
-- Add is_active flag to users (admin can disable a student)
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- Add avatar_url to users
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Add phone to users
ALTER TABLE users ADD COLUMN phone TEXT;

-- Add created_by to courses (track which admin created it)
ALTER TABLE courses ADD COLUMN created_by INTEGER;
```

No new tables required for MVP. All existing tables (`users`, `courses`, `enrollments`, `attendance`, `grades`, `timetable`, `announcements`, `documents`, `notifications`) are sufficient.

---

## 6. Backend API — New/Updated Endpoints

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/dashboard-stats` | Counts for dashboard cards | auth+admin |
| GET | `/admin/students` | List all students | auth+admin |
| GET | `/admin/students/:id` | Get single student | auth+admin |
| POST | `/admin/students` | Create student | auth+admin |
| PUT | `/admin/students/:id` | Update student | auth+admin |
| DELETE | `/admin/students/:id` | Delete student | auth+admin |
| PUT | `/admin/students/:id/toggle-active` | Enable/disable student | auth+admin |
| GET | `/admin/students/:id/courses` | Student's enrolled courses | auth+admin |
| GET | `/admin/courses` | List all courses | auth+admin |
| POST | `/admin/courses` | Create course | auth+admin |
| PUT | `/admin/courses/:id` | Update course | auth+admin |
| DELETE | `/admin/courses/:id` | Delete course | auth+admin |
| GET | `/admin/courses/:id/students` | Enrolled students in course | auth+admin |
| POST | `/admin/attendance` | Mark attendance (bulk) | auth+admin |
| GET | `/admin/attendance/report` | Attendance report per course | auth+admin |
| GET | `/admin/timetable` | List timetable slots | auth+admin |
| POST | `/admin/timetable` | Add timetable slot | auth+admin |
| DELETE | `/admin/timetable/:id` | Remove slot | auth+admin |

### Existing routes to keep (already built)
- `/api/auth/*`, `/api/courses/*`, `/api/attendance/*`, `/api/grades/*`, `/api/timetable/*`, `/api/announcements/*`, `/api/documents/*`, `/api/notifications/*`, `/api/users/*`

---

## 7. Frontend — Page Structure (`frontend/src/`)

```
frontend/src/
├── main.jsx              # App entry point
├── App.jsx               # Router setup
├── index.css             # Global styles (Tailwind)
├── services/
│   └── api.js            # Axios instance with auth interceptor
├── context/
│   └── AuthContext.jsx   # Auth state (user, token, login, logout)
├── components/
│   ├── Layout.jsx        # Sidebar + header wrapper
│   ├── AdminLayout.jsx   # Admin-specific layout
│   ├── StudentLayout.jsx # Student-specific layout
│   ├── ProtectedRoute.jsx # Role-based route guard
│   ├── StatsCard.jsx
│   ├── DataTable.jsx
│   └── ...
├── pages/
│   ├── Login.jsx         # Common login (redirects by role)
│   ├── AdminDashboard.jsx
│   ├── AdminStudents.jsx
│   ├── AdminCourses.jsx
│   ├── AdminAttendance.jsx
│   ├── AdminTimetable.jsx
│   ├── AdminAnnouncements.jsx
│   ├── AdminDocuments.jsx
│   ├── StudentDashboard.jsx
│   ├── StudentCourses.jsx
│   ├── StudentAttendance.jsx
│   ├── StudentGrades.jsx
│   ├── StudentTimetable.jsx
│   ├── StudentAnnouncements.jsx
│   ├── StudentDocuments.jsx
│   └── StudentProfile.jsx
```

---

## 8. Implementation Phases

### Phase 1 — Frontend Setup + Auth (Week 1)
- [ ] Create `frontend/src/` folder structure
- [ ] Install dependencies (already in package.json)
- [ ] Set up Vite, React Router, Tailwind CSS
- [ ] Create `api.js` with axios + JWT interceptor
- [ ] Create `AuthContext` (login, logout, current user)
- [ ] Build `Login.jsx` page — role-based redirect (admin → `/admin/dashboard`, student → `/student/dashboard`)
- [ ] Protect routes with `ProtectedRoute`

### Phase 2 — Admin Side (Week 2)
- [ ] Admin layout with sidebar
- [ ] Admin Dashboard (stats + quick actions)
- [ ] Manage Students (list, add, edit, delete, toggle active)
- [ ] Manage Classes/Courses (CRUD + enroll students)
- [ ] Mark Attendance (select course, mark present/absent)

### Phase 3 — Admin Remaining + Timetable (Week 3)
- [ ] Timetable management
- [ ] Announcements (create/publish)
- [ ] Documents (upload/list)
- [ ] Admin profile

### Phase 4 — Student Side (Week 4)
- [ ] Student layout
- [ ] Student Dashboard (own courses, attendance, grades, timetable)
- [ ] My Courses, My Attendance, My Grades
- [ ] My Timetable, Announcements, Documents
- [ ] Student Profile

### Phase 5 — Polish & Testing (Week 5)
- [ ] Fix route-order issue (Express `/:id` greedy match) — already documented in AGENTS.md
- [ ] Error handling + loading states
- [ ] Responsive design (mobile + desktop)
- [ ] Manual test with demo accounts:
  - Admin: `admin@tuke.sk / admin123`
  - Student: `student@tuke.sk / demo123`

---

## 9. Demo Accounts (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tuke.sk` | `admin123` |
| Student | `student@tuke.sk` | `demo123` |

---

## 10. How to Run

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run migrate
npm run seed
npm start
# http://localhost:5001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

**Health check:** `http://localhost:5001/api/health`

---

## 11. Key Gotchas (from AGENTS.md)

1. **Route order in `backend/src/routes/courses.js`:** Specific routes (`/enroll`, `/my-enrollments`) must be declared **before** `router.get('/:id', ...)` because Express matches `/:id` greedily.
2. **Frontend proxies `/api` → `http://localhost:5001`** via `vite.config.js`.
3. **Backend `.env`** must exist before first run (see AGENTS.md).

---

## 12. Success Criteria

- [ ] Admin can log in and see dashboard
- [ ] Admin can add/edit/delete students
- [ ] Admin can add/edit/delete courses and enroll students
- [ ] Admin can mark attendance for any course
- [ ] Student can log in and see their own data only
- [ ] Student cannot access admin routes (403 if they try)
- [ ] Both services run simultaneously on ports 5001 and 3000
