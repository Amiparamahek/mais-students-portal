import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentAttendance() {
  const [totals, setTotals] = useState([]);
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/attendance/my-attendance'), api.get('/attendance/my-log')])
      .then(([t, l]) => {
        setTotals(t.data || []);
        setLog(l.data || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load attendance'));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground">How many lectures you attended, by class and by date.</p>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="py-0">
        <CardHeader className="pt-6"><CardTitle>By class</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Class</TableHead>
              <TableHead>Held</TableHead>
              <TableHead>Attended</TableHead>
              <TableHead className="pr-6">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totals.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No attendance recorded yet.</TableCell></TableRow>}
            {totals.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-6 font-medium">{t.course_code} - {t.course_name}</TableCell>
                <TableCell>{t.classes_held}</TableCell>
                <TableCell>{t.classes_attended}</TableCell>
                <TableCell className="pr-6"><Badge variant={t.percentage < 75 ? 'destructive' : 'secondary'}>{t.percentage ?? 0}%</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="py-0">
        <CardHeader className="pt-6">
          <CardTitle>By date</CardTitle>
          <CardDescription>Each lecture that was recorded for you.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Date</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {log.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No dated records yet.</TableCell></TableRow>}
            {log.map((r) => (
              <TableRow key={`${r.course_id}-${r.class_date}`}>
                <TableCell className="pl-6">{r.class_date}</TableCell>
                <TableCell>{r.course_code}</TableCell>
                <TableCell className="pr-6"><Badge variant={r.present ? 'secondary' : 'destructive'}>{r.present ? 'Present' : 'Absent'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
