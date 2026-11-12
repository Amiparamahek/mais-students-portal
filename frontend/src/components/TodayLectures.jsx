import React, { useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS = {
  open: { label: 'Open now', variant: 'default' },
  present: { label: 'Present', variant: 'secondary' },
  absent: { label: 'Absent', variant: 'destructive' },
  missed: { label: 'Missed', variant: 'destructive' },
  upcoming: { label: 'Not started', variant: 'outline' },
};

// Today's lectures. A lecture opens 15 minutes before it starts. Check-in is the student's
// own action; anything not checked in by the end of the lecture is recorded as absent.
export default function TodayLectures() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  useLiveFetch(() => api.get('/attendance/today').then((r) => setData(r.data)), []);

  const checkIn = async (lecture) => {
    setBusy(lecture.timetable_id);
    setMessage(null);
    try {
      const res = await api.post('/attendance/check-in', { timetableId: lecture.timetable_id });
      setMessage({ ok: true, text: res.data.message });
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not check in' });
    } finally {
      setBusy(null);
      api.get('/attendance/today').then((r) => setData(r.data)).catch(() => {});
    }
  };

  const lectures = data?.lectures || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's lectures</CardTitle>
        <CardDescription>
          {data
            ? lectures.length === 0
              ? `No lectures today (${data.now}).`
              : `${lectures.length} ${lectures.length === 1 ? 'lecture' : 'lectures'} today. Check in when your class has started.`
            : 'Loading...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>
        )}
        {lectures.map((l) => {
          const st = STATUS[l.status] || STATUS.upcoming;
          return (
            <div key={l.timetable_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{l.course_code} - {l.course_name}</p>
                <p className="text-sm text-muted-foreground">
                  {l.time} · Room {l.room || '-'}{l.building ? `, ${l.building}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={st.variant}>{st.label}</Badge>
                {l.status === 'upcoming' && <span className="text-xs text-muted-foreground">Opens {l.opens_at}</span>}
                {l.can_check_in && (
                  <Button size="sm" disabled={busy === l.timetable_id} onClick={() => checkIn(l)}>
                    {busy === l.timetable_id ? 'Checking in...' : 'Check in'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
