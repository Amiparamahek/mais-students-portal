import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalAnnouncements: 0,
    avgAttendance: '0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes, announcementsRes, attendanceRes] =
        await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/courses'),
          api.get('/announcements'),
          api.get('/admin/attendance/report'),
        ]);

      const students = usersRes.data || [];
      const courses = coursesRes.data || [];
      const announcements = announcementsRes.data || [];

      setStats({
        totalStudents: students.length,
        totalCourses: courses.length,
        totalAnnouncements: announcements.length,
        avgAttendance: '92%',
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
        <p className="text-gray-500">
          Manage students, classes, attendance, and more.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="👨‍🎓"
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Total Classes"
          value={stats.totalCourses}
          icon="📚"
          color="text-green-600 bg-green-50"
        />
        <StatCard
          title="Announcements"
          value={stats.totalAnnouncements}
          icon="📢"
          color="text-purple-600 bg-purple-50"
        />
        <StatCard
          title="Avg Attendance"
          value={stats.avgAttendance}
          icon="✅"
          color="text-orange-600 bg-orange-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            label="Add Student"
            icon="➕"
            onClick={() => {}}
            color="bg-blue-50 text-blue-600"
          />
          <QuickAction
            label="Add Class"
            icon="📖"
            onClick={() => {}}
            color="bg-green-50 text-green-600"
          />
          <QuickAction
            label="Mark Attendance"
            icon="✅"
            onClick={() => {}}
            color="bg-orange-50 text-orange-600"
          />
          <QuickAction
            label="Send Announcement"
            icon="📢"
            onClick={() => {}}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const [bgColor, textColor] = color.split(' ');
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${bgColor}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm ${textColor}`} />
      </div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function QuickAction({ label, icon, onClick, color }) {
  const [bgColor, textColor] = color.split(' ');
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition ${bgColor} text-center`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-sm font-medium ${textColor}`}>{label}</p>
    </div>
  );
}
