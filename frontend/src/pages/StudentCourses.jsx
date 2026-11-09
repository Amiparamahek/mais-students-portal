import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/courses/my-enrollments'), api.get('/timetable')])
      .then(([c, t]) => {
        setCourses(c.data || []);
        setSlots(t.data || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load classes'));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My classes</h2>
        <p className="text-muted-foreground">The classes you are enrolled in, with their weekly times. Use Find Courses to register for more.</p>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {courses.length === 0 && !error && <p className="text-sm text-muted-foreground">You are not enrolled in any class yet.</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {courses.map((c) => {
          const mine = slots.filter((s) => s.course_id === c.course_id);
          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.code} - {c.name}</CardTitle>
                <CardDescription>{c.semester || '-'} · {c.credits} credits · {c.lecturer || 'Lecturer not set'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mine.length === 0 && <p className="text-sm text-muted-foreground">No timetable slot set yet.</p>}
                {mine.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.day}</span>
                    <span className="flex gap-2"><Badge variant="secondary">{s.time}</Badge><Badge variant="outline">Room {s.room || '-'}</Badge></span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
