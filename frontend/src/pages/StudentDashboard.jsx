import React, { useState, useEffect } from 'react';
import { Approved, Award, Book } from '@duo-icons/react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, gRes, aRes, anRes] = await Promise.all([
        api.get('/courses/my-enrollments'),
        api.get('/grades/my-grades'),
        api.get('/attendance/my-attendance'),
        api.get('/announcements'),
      ]);
      setCourses(cRes.data || []);
      setGrades(gRes.data || []);
      setAttendance(aRes.data || []);
      setAnnouncements((anRes.data || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const avgAttendance =
    attendance.length > 0
      ? Math.round(
          (attendance.reduce((sum, a) => sum + (a.classes_attended || 0), 0) /
            attendance.reduce((sum, a) => sum + Math.max(a.classes_held || 0, 1), 0)) *
            100
        ) || 0
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your portal.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="My Classes" value={courses.length} icon={Book} />
        <StatCard title="Attendance" value={avgAttendance + '%'} icon={Approved} />
        <StatCard title="Published Grades" value={grades.length} icon={Award} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes enrolled yet. Your admin will add you to classes.</p>
            ) : (
              <ul className="space-y-3">
                {courses.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                    <span className="text-sm font-medium">{c.code} - {c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.semester || '-'}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-lg border bg-muted/40 p-3">
                    <h4 className="text-sm font-medium">{a.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{a.content}</p>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
