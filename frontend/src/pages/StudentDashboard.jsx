import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Approved, Award, Book, Calendar, Clipboard } from '@duo-icons/react';
import api from '../services/api';
import { toISODate, weekdayOf, slotStart } from '../lib/date';
import StatCard from '../components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses/my-enrollments'),
      api.get('/grades/my-grades'),
      api.get('/attendance/my-attendance'),
      api.get('/timetable'),
      api.get('/exams'),
      api.get('/announcements'),
    ])
      .then(([c, g, a, t, e, an]) => {
        setCourses(c.data || []);
        setGrades(g.data || []);
        setAttendance(a.data || []);
        setTimetable(t.data || []);
        setExams(e.data || []);
        setAnnouncements((an.data || []).slice(0, 5));
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const held = attendance.reduce((n, a) => n + (a.classes_held || 0), 0);
  const attended = attendance.reduce((n, a) => n + (a.classes_attended || 0), 0);
  const avgAttendance = held ? Math.round((attended / held) * 100) : 0;

  const today = new Date();
  const todayName = weekdayOf(today);
  const todayISO = toISODate(today);
  const todaysLectures = timetable
    .filter((t) => t.day === todayName)
    .sort((a, b) => slotStart(a.time).localeCompare(slotStart(b.time)));
  const upcomingExams = exams.filter((x) => x.exam_date >= todayISO).slice(0, 3);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-foreground" />
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
        <StatCard title="My classes" value={courses.length} icon={Book} />
        <StatCard title="Attendance" value={`${avgAttendance}%`} icon={Approved} />
        <StatCard title="Published grades" value={grades.length} icon={Award} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today: {todayName}</CardTitle>
          <CardDescription>
            {todaysLectures.length === 0
              ? 'No lectures today.'
              : `${todaysLectures.length} ${todaysLectures.length === 1 ? 'lecture' : 'lectures'} today`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysLectures.length > 0 && (
            <ul className="divide-y">
              {todaysLectures.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{t.course_code} - {t.course_name}</p>
                    <p className="text-sm text-muted-foreground">{t.lecturer || 'Lecturer not set'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t.time}</Badge>
                    <Badge variant="outline">Room {t.room || '-'}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/student/timetable" className="mt-4 inline-block text-sm underline">Full weekly timetable</Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="size-5" /> Upcoming exams</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingExams.map((x) => (
                  <li key={x.id} className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-sm font-medium">{x.exam_name} - {x.code}</p>
                    <p className="text-xs text-muted-foreground">{x.exam_date}{x.exam_time ? ` at ${x.exam_time}` : ''}{x.room ? `, room ${x.room}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clipboard className="size-5" /> Latest announcements</CardTitle>
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
                    <span className="mt-2 block text-xs text-muted-foreground">{new Date(a.created_at + 'Z').toLocaleDateString()}</span>
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
