import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Approved, Clock, User } from '@duo-icons/react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { formatDateTime, timeAgo } from '../lib/date';
import StatCard from '../components/StatCard';
import Bar from '../components/Bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATE = {
  open: { label: 'Open now', variant: 'default' },
  upcoming: { label: 'Not started', variant: 'outline' },
  closed: { label: 'Ended', variant: 'secondary' },
};

const StudentLink = ({ s }) => (
  <Link to={`/admin/students/${s.id}`} className="font-medium underline-offset-4 hover:underline">{s.name}</Link>
);

export default function AdminAnalysis() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useLiveFetch(
    () =>
      api
        .get('/admin/analysis')
        .then((r) => {
          setD(r.data);
          setError('');
        })
        .catch((e) => setError(e.response?.data?.message || 'Failed to load analysis')),
    []
  );

  if (!d) {
    return error ? (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
    ) : (
      <div className="flex h-64 items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>
    );
  }

  const t = d.totals;
  const peak = Math.max(1, ...d.loginsByDay.map((x) => x.logins));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analysis</h2>
        <p className="text-muted-foreground">What is happening right now and who needs attention. Updates every few seconds.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value={`${t.active_students} / ${t.students} active`} icon={User} />
        <StatCard title="Online now (15 min)" value={t.online_now} icon={Clock} />
        <StatCard title="Overall attendance" value={t.attendance_percentage == null ? 'No data' : `${t.attendance_percentage}%`} icon={Approved} />
        <StatCard title={`Below ${d.threshold}% attendance`} value={t.at_risk} icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today: {d.day}</CardTitle>
          <CardDescription>
            {d.todayLectures.length === 0 ? 'No lectures scheduled today.' : `${d.todayLectures.length} ${d.todayLectures.length === 1 ? 'lecture' : 'lectures'}. ${t.logged_in_today} ${t.logged_in_today === 1 ? 'student' : 'students'} signed in today.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.todayLectures.map((l) => {
            const st = STATE[l.state] || STATE.upcoming;
            const total = Math.max(l.enrolled, 1);
            return (
              <div key={l.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{l.code} - {l.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{l.time} · Room {l.room || '-'}{l.building ? `, ${l.building}` : ''}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Bar value={(l.present / total) * 100} />
                  <span className="shrink-0 text-xs text-muted-foreground">{l.present} present · {l.absent} absent · {l.pending} not yet</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sign-ins, last 14 days</CardTitle>
            <CardDescription>Taller bar means more sign-ins that day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-1.5">
              {d.loginsByDay.map((x) => (
                <div key={x.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${x.day}: ${x.logins} sign-ins by ${x.people} people`}>
                  <span className="text-[10px] text-muted-foreground">{x.logins || ''}</span>
                  <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max((x.logins / peak) * 100, x.logins ? 4 : 1)}%`, opacity: x.logins ? 1 : 0.2 }} />
                  <span className="text-[10px] text-muted-foreground">{x.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance by class</CardTitle>
            <CardDescription>Share of lectures students attended, per class.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.perClass.map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{c.code} <span className="font-normal text-muted-foreground">({c.enrolled} students)</span></span>
                  <span>{c.percentage == null ? 'No lectures yet' : `${c.percentage}%`}</span>
                </div>
                <Bar value={c.percentage ?? 0} danger={c.percentage != null && c.percentage < d.threshold} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Most absent students</CardTitle>
            <CardDescription>Ranked by lectures missed. Click a name for the full record.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>Missed</TableHead>
                <TableHead className="pr-6">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.mostAbsent.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No attendance recorded yet.</TableCell></TableRow>}
              {d.mostAbsent.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6"><StudentLink s={s} /></TableCell>
                  <TableCell>{s.absences} of {s.held}</TableCell>
                  <TableCell className="pr-6"><Badge variant={s.percentage < d.threshold ? 'destructive' : 'secondary'}>{s.percentage}%</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>At risk (below {d.threshold}%)</CardTitle>
            <CardDescription>Students who may need a conversation.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead className="pr-6">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.atRisk.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Nobody is below {d.threshold}%.</TableCell></TableRow>}
              {d.atRisk.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6"><StudentLink s={s} /></TableCell>
                  <TableCell>{s.programme || '-'}</TableCell>
                  <TableCell className="pr-6"><Badge variant="destructive">{s.percentage}%</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Never signed in</CardTitle>
            <CardDescription>Accounts that have not used the portal yet.</CardDescription>
          </CardHeader>
          <Table>
            <TableBody>
              {d.neverLoggedIn.length === 0 && <TableRow><TableCell className="py-6 text-center text-muted-foreground">Every student has signed in.</TableCell></TableRow>}
              {d.neverLoggedIn.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6"><StudentLink s={s} /></TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground">{s.student_id || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Recent sign-ins</CardTitle>
            <CardDescription>The latest activity across all accounts.</CardDescription>
          </CardHeader>
          <Table>
            <TableBody>
              {d.recentLogins.length === 0 && <TableRow><TableCell className="py-6 text-center text-muted-foreground">No sign-ins recorded yet.</TableCell></TableRow>}
              {d.recentLogins.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">
                    {l.role === 'student' ? <StudentLink s={{ id: l.user_id, name: l.name }} /> : <span className="font-medium">{l.name}</span>}
                    {l.role === 'admin' && <span className="ml-2 text-xs text-muted-foreground">admin</span>}
                  </TableCell>
                  <TableCell><Badge variant={l.success ? 'secondary' : 'destructive'}>{l.success ? 'Signed in' : 'Failed'}</Badge></TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground" title={formatDateTime(l.logged_in_at)}>{timeAgo(l.logged_in_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
