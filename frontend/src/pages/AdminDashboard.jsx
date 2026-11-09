import React, { useState, useEffect } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Approved, Bell, Book, Calendar } from '@duo-icons/react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalAnnouncements: 0,
    avgAttendance: '0%',
  });
  const [loading, setLoading] = useState(true);

  useLiveFetch(() => {
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

      const students = (usersRes.data || []).filter((u) => u.role === 'student');
      const courses = coursesRes.data || [];
      const announcements = announcementsRes.data || [];

      setStats({
        totalStudents: students.length,
        totalCourses: courses.length,
        totalAnnouncements: announcements.length,
        avgAttendance: avgPercent(attendanceRes.data || []),
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const actions = [
    { label: 'Add Student', icon: Users, to: '/admin/students' },
    { label: 'Add Class', icon: Book, to: '/admin/courses' },
    { label: 'Mark Attendance', icon: Approved, to: '/admin/attendance' },
    { label: 'Send Announcement', icon: Bell, to: '/admin/announcements' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage students, classes, attendance, and more.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} />
        <StatCard title="Total Classes" value={stats.totalCourses} icon={Book} />
        <StatCard title="Announcements" value={stats.totalAnnouncements} icon={Bell} />
        <StatCard title="Avg Attendance" value={stats.avgAttendance} icon={Calendar} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              <Icon className="size-6" />
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function avgPercent(report) {
  const held = report.reduce((n, r) => n + (r.classes_held || 0), 0);
  const attended = report.reduce((n, r) => n + (r.classes_attended || 0), 0);
  return held ? Math.round((attended / held) * 100) + '%' : '0%';
}
