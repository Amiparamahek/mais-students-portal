import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toISODate } from '../lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mark attendance for one class on one date. Saving the same date again updates it.
export default function AdminAttendance() {
  const [classes, setClasses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(toISODate());
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState({});
  const [totals, setTotals] = useState([]);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/teaching/classes').then((r) => {
      setClasses(r.data || []);
      if (r.data?.[0]) setCourseId(String(r.data[0].id));
    });
  }, []);

  // Roster plus any attendance already saved for this class and date.
  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      api.get(`/teaching/classes/${courseId}/students`),
      api.get(`/teaching/classes/${courseId}/attendance`, { params: { date } }),
    ]).then(([s, a]) => {
      setStudents(s.data || []);
      const saved = Object.fromEntries((a.data.marks || []).map((m) => [m.student_id, !!m.present]));
      setPresent(Object.fromEntries((s.data || []).map((st) => [st.id, saved[st.id] ?? true])));
      setTotals(a.data.totals || []);
    });
  }, [courseId, date]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = students.map((s) => ({ student_id: s.id, course_id: Number(courseId), present: !!present[s.id] }));
      await api.post('/attendance', { date, records });
      setMessage({ ok: true, text: `Attendance saved for ${date}.` });
      const a = await api.get(`/teaching/classes/${courseId}/attendance`, { params: { date } });
      setTotals(a.data.totals || []);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not save attendance' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground">Pick a class and date, then tick who attended.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Class</Label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={save} disabled={saving || students.length === 0} className="w-full">
              {saving ? 'Saving...' : 'Save attendance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Student</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead className="pr-6 text-right">Present</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No students enrolled in this class.</TableCell></TableRow>}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                <TableCell>{s.student_id || '-'}</TableCell>
                <TableCell className="pr-6 text-right">
                  <input
                    type="checkbox"
                    aria-label={`Present: ${s.name}`}
                    checked={!!present[s.id]}
                    onChange={(e) => setPresent({ ...present, [s.id]: e.target.checked })}
                    className="size-4"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="py-0">
        <CardHeader className="pt-6"><CardTitle>Totals for this class</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Student</TableHead>
              <TableHead>Held</TableHead>
              <TableHead className="pr-6">Attended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totals.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No attendance recorded yet.</TableCell></TableRow>}
            {totals.map((t) => (
              <TableRow key={t.student_id}>
                <TableCell className="pl-6">{t.student_name}</TableCell>
                <TableCell>{t.classes_held}</TableCell>
                <TableCell className="pr-6">{t.classes_attended}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
