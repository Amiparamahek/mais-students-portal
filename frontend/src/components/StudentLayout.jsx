import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CheckClock,
  Calendar,
  Bell,
  FileText,
  User,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react';

const studentMenu = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { name: 'My Courses', icon: BookOpen, path: '/student/courses' },
  { name: 'Attendance', icon: CheckClock, path: '/student/attendance' },
  { name: 'Grades', icon: BookOpen, path: '/student/grades' },
  { name: 'Timetable', icon: Calendar, path: '/student/timetable' },
  { name: 'Announcements', icon: Bell, path: '/student/announcements' },
  { name: 'Documents', icon: FileText, path: '/student/documents' },
  { name: 'Profile', icon: User, path: '/student/profile' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-green-600">MAIS Student</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-1">
          {studentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-600 transition"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Student Portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600">
              {user?.name || 'Student'}
            </span>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium">
              {user?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
