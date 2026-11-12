import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AlertTriangle, Approved, Book, Clock } from '@duo-icons/react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { formatDateTime, timeAgo } from '../lib/date';
import StatCard from '../components/StatCard';
import Bar from '../components/Bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium break-words">{value || '-'}</p>
  </div>
);

const Empty = ({ cols, children }) => (
  <TableRow><TableCell colSpan={cols} className="py-6 text-center text-muted-foreground">{children}</TableCell></TableRow>
);

export default function AdminStudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useLiveFetch(
    () =>
      api
        .get(`/admin/students/${id}/profile`)
        .then((r) => {
          setData(r.data);
          setError('');
        })
        .catch((e) => setError(e.response?.status === 404 ? 'Student not found.' : e.response?.data?.message || 'Failed to load student')),
    [id]
  );

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm underline"><ArrowLeft className="size-4" /> Students</Link>
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }
  if (!data) return <div className="flex h-64 items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>;

  const { student: s, summary: m, enrollments, attendance, attendanceLog, grades, recentLogins, upcomingExams } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm underline"><ArrowLeft className="size-4" /> Students</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{s.name}</h2>
        <Badge variant={s.is_active ? 'secondary' : 'destructive'}>{s.is_active ? 'Active' : 'Deactivated'}</Badge>
        {m.at_risk && <Badge variant="destructive">Attendance below 75%</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Classes" value={m.classes} icon={Book} />
        <StatCard title="Attendance" value={m.attendance_percentage == null ? 'No data' : `${m.attendance_percentage}%`} icon={Approved} />
        <StatCard title="Lectures missed" value={`${m.lectures_missed} of ${m.lectures_held}`} icon={AlertTriangle} />
        <StatCard title="Days signed in" value={m.login_days} icon={Clock} />
      </div>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Email" value={s.email} />
          <Field label="Student ID" value={s.student_id} />
          <Field label="Programme" value={s.programme} />
          <Field label="Faculty" value={s.faculty} />
          <Field label="Academic year" value={s.academic_year} />
          <Field label="Study status" value={s.study_status} />
          <Field label="Phone" value={s.phone} />
          <Field label="Account created" value={formatDateTime(s.created_at)} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardHeader className="pt-6">
          <CardTitle>Classes and attendance</CardTitle>
          <CardDescription>Lectures held, attended and missed in each enrolled class.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Class</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Held</TableHead>
              <TableHead>Attended</TableHead>
              <TableHead>Missed</TableHead>
              <TableHead className="pr-6 min-w-40">Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 && <Empty cols={7}>Not enrolled in any class.</Empty>}
            {enrollments.map((e) => {
              const a = attendance.find((x) => x.course_id === e.course_id);
              return (
                <TableRow key={e.course_id}>
                  <TableCell className="pl-6 font-medium">{e.code} - {e.name}</TableCell>
                  <TableCell>{e.lecturer || '-'}</TableCell>
                  <TableCell>{new Date(e.enrolled_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</TableCell>
                  <TableCell>{a?.classes_held ?? 0}</TableCell>
                  <TableCell>{a?.classes_attended ?? 0}</TableCell>
                  <TableCell>{a?.absences ?? 0}</TableCell>
                  <TableCell className="pr-6">
                    {a?.percentage == null ? <span className="text-muted-foreground">No lectures yet</span> : (
                      <div className="flex items-center gap-2"><Bar value={a.percentage} danger={a.percentage < 75} /><span className="w-12 text-sm">{a.percentage}%</span></div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Attendance by date</CardTitle>
            <CardDescription>
              {m.dated_records} dated {m.dated_records === 1 ? 'record' : 'records'}: {m.dated_present} present. Older totals have no dates.
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">How</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLog.length === 0 && <Empty cols={4}>No dated attendance yet.</Empty>}
              {attendanceLog.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">{r.class_date}</TableCell>
                  <TableCell>{r.course_code}</TableCell>
                  <TableCell><Badge variant={r.present ? 'secondary' : 'destructive'}>{r.present ? 'Present' : 'Absent'}</Badge></TableCell>
                  <TableCell className="pr-6 text-muted-foreground">{r.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Sign-in activity</CardTitle>
            <CardDescription>
              {m.total_logins} sign-ins on {m.login_days} different days ({m.login_days_last_30} in the last 30 days). Last seen {timeAgo(m.last_login)}.
              {m.failed_logins_last_30 > 0 && ` ${m.failed_logins_last_30} failed attempts in the last 30 days.`}
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">When</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="pr-6">Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogins.length === 0 && <Empty cols={3}>This student has never signed in.</Empty>}
              {recentLogins.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">{formatDateTime(l.logged_in_at)}</TableCell>
                  <TableCell><Badge variant={l.success ? 'secondary' : 'destructive'}>{l.success ? 'Signed in' : 'Failed'}</Badge></TableCell>
                  <TableCell className="max-w-48 truncate pr-6 text-xs text-muted-foreground" title={l.user_agent}>{l.user_agent || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-6"><CardTitle>Grades</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Class</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 && <Empty cols={4}>No grades yet.</Empty>}
              {grades.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="pl-6">{g.course_code}</TableCell>
                  <TableCell>{g.assessment}</TableCell>
                  <TableCell className="font-semibold">{g.grade}</TableCell>
                  <TableCell className="pr-6"><Badge variant={g.status === 'published' ? 'secondary' : 'outline'}>{g.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Upcoming exams</CardTitle>
            <CardDescription>{m.notifications_unread} of {m.notifications_total} notifications unread.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-6">Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingExams.length === 0 && <Empty cols={4}>No upcoming exams.</Empty>}
              {upcomingExams.map((x, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">{x.exam_name}</TableCell>
                  <TableCell>{x.code}</TableCell>
                  <TableCell>{x.exam_date}{x.exam_time ? ` ${x.exam_time}` : ''}</TableCell>
                  <TableCell className="pr-6">{x.room || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
