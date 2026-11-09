import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { WEEKDAYS, weekdayOf, slotStart } from '../lib/date';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StudentTimetable() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = weekdayOf();

  useEffect(() => {
    api.get('/timetable')
      .then((r) => setSlots(r.data || []))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load timetable'))
      .finally(() => setLoading(false));
  }, []);

  const days = WEEKDAYS.slice(0, 6); // Monday to Saturday
  const byDay = Object.fromEntries(days.map((d) => [d, []]));
  slots.forEach((s) => byDay[s.day]?.push(s));
  Object.values(byDay).forEach((list) => list.sort((a, b) => slotStart(a.time).localeCompare(slotStart(b.time))));

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My timetable</h2>
        <p className="text-muted-foreground">Weekly lectures for your classes. Times are campus local time.</p>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => (
          <Card key={day} className={day === today ? 'ring-2 ring-foreground/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {day}
                {day === today && <Badge>Today</Badge>}
              </CardTitle>
              <CardDescription>{byDay[day].length === 0 ? 'No lectures' : `${byDay[day].length} lecture${byDay[day].length > 1 ? 's' : ''}`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byDay[day].map((s) => (
                <div key={s.id} className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-sm font-medium">{s.course_code} - {s.course_name}</p>
                  <p className="text-xs text-muted-foreground">{s.time} · Room {s.room || '-'} · {s.lecturer || 'Lecturer not set'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {slots.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No lectures scheduled for your classes yet.</p>
      )}
    </div>
  );
}
