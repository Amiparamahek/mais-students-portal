import React from 'react';
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
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminCourses from './pages/AdminCourses';
import AdminAttendance from './pages/AdminAttendance';
import AdminTimetable from './pages/AdminTimetable';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminDocuments from './pages/AdminDocuments';
import AdminGrades from './pages/AdminGrades';
import AdminExams from './pages/AdminExams';
import StudentFindCourses from './pages/StudentFindCourses';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentAttendance from './pages/StudentAttendance';
import StudentGrades from './pages/StudentGrades';
import StudentTimetable from './pages/StudentTimetable';
import StudentAnnouncements from './pages/StudentAnnouncements';
import StudentDocuments from './pages/StudentDocuments';
import StudentProfile from './pages/StudentProfile';
import StudentExams from './pages/StudentExams';
import StudentNotifications from './pages/StudentNotifications';

// Auth pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

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
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="timetable" element={<AdminTimetable />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="documents" element={<AdminDocuments />} />
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
                  <Route path="documents" element={<StudentDocuments />} />
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
