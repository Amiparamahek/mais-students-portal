import React from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { formatDateTime } from '../lib/date';
import StatCard from '../components/StatCard';
import Bar from '../components/Bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Approved, Award, Book } from '@duo-icons/react';
import { useState } from 'react';

export default function StudentResults() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useLiveFetch(
    () =>
      api
        .get('/reports/my-results')
        .then((r) => {
          setData(r.data);
          setError('');
        })
        .catch((e) => setError(e.response?.data?.message || 'Could not load your results')),
    []
  );

  if (!data) {
    return error ? (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
    ) : (
      <div className="flex h-64 items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>
    );
  }

  const o = data.overall;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My results</h2>
        <p className="text-muted-foreground">Attendance and published grades for each of your classes.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Classes" value={o.classes} icon={Book} />
        <StatCard title="Overall attendance" value={o.attendance_percentage == null ? 'No lectures yet' : `${o.attendance_percentage}%`} icon={Approved} />
        <StatCard title="Published grades" value={o.grades_published} icon={Award} />
      </div>

      {data.classes.length === 0 && (
        <Card><CardContent className="py-6 text-center text-muted-foreground">You are not enrolled in any class yet.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.classes.map((c) => (
          <Card key={c.course_id}>
            <CardHeader>
              <CardTitle>{c.code} - {c.name}</CardTitle>
              <CardDescription>{c.semester || '-'} · {c.credits} credits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Attendance: {c.lectures_attended} of {c.lectures_held} lectures</span>
                  <Badge variant={c.attendance_percentage != null && c.attendance_percentage < 75 ? 'destructive' : 'secondary'}>
                    {c.attendance_percentage == null ? 'No lectures yet' : `${c.attendance_percentage}%`}
                  </Badge>
                </div>
                {c.attendance_percentage != null && <Bar value={c.attendance_percentage} danger={c.attendance_percentage < 75} />}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Grades</p>
                {c.grades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No published grades yet.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {c.grades.map((g, i) => (
                      <li key={i} className="flex justify-between py-2">
                        <span>{g.assessment}</span>
                        <span className="font-semibold">{g.grade} <span className="ml-2 font-normal text-muted-foreground">{formatDateTime(g.grade_date)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
