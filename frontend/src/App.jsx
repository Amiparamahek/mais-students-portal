import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';

// Layouts
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';

// Admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const AdminStudentDetail = lazy(() => import('./pages/AdminStudentDetail'));
const AdminAnalysis = lazy(() => import('./pages/AdminAnalysis'));
const AdminCourses = lazy(() => import('./pages/AdminCourses'));
const AdminAttendance = lazy(() => import('./pages/AdminAttendance'));
const AdminTimetable = lazy(() => import('./pages/AdminTimetable'));
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements'));
const AdminGrades = lazy(() => import('./pages/AdminGrades'));
const AdminExams = lazy(() => import('./pages/AdminExams'));
const StudentFindCourses = lazy(() => import('./pages/StudentFindCourses'));

// Student pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/StudentCourses'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const StudentGrades = lazy(() => import('./pages/StudentGrades'));
const StudentTimetable = lazy(() => import('./pages/StudentTimetable'));
const StudentAnnouncements = lazy(() => import('./pages/StudentAnnouncements'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentExams = lazy(() => import('./pages/StudentExams'));
const StudentNotifications = lazy(() => import('./pages/StudentNotifications'));

// Auth pages
import Login from './pages/Login';
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            user && user.role === 'admin' ? (
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="students/:id" element={<AdminStudentDetail />} />
                  <Route path="analysis" element={<AdminAnalysis />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="timetable" element={<AdminTimetable />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="grades" element={<AdminGrades />} />
                  <Route path="exams" element={<AdminExams />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            user && user.role === 'student' ? (
              <StudentLayout>
                <Routes>
                  <Route index element={<StudentDashboard />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="courses" element={<StudentCourses />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="timetable" element={<StudentTimetable />} />
                  <Route path="announcements" element={<StudentAnnouncements />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="exams" element={<StudentExams />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="find-courses" element={<StudentFindCourses />} />
                </Routes>
              </StudentLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
