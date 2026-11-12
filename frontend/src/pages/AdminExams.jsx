import React, { useEffect, useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import { examTimeRange } from '../lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const empty = { courseId: '', examName: '', examDate: '', examTime: '', examEndTime: '', room: '' };

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [e, c] = await Promise.all([api.get('/exams'), api.get('/admin/courses')]);
    setExams(e.data || []);
    setCourses(c.data || []);
  };

  useLiveFetch(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load data'));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/exams', { ...form, courseId: Number(form.courseId) });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exams</h2>
        <p className="text-muted-foreground">Scheduled exams are shared with every student.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule exam</CardTitle>
          <CardDescription>Students are notified when an exam is added.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Class</Label>
              <select required value={form.courseId} onChange={set('courseId')}>
                <option value="">Select class</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Exam name</Label>
              <Input required placeholder="Final exam" value={form.examName} onChange={set('examName')} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input required type="date" value={form.examDate} onChange={set('examDate')} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={form.examTime} onChange={set('examTime')} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input type="time" value={form.examEndTime} onChange={set('examEndTime')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Room</Label>
              <Input placeholder="B2" value={form.room} onChange={set('room')} />
            </div>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Schedule exam'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Exam</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No exams scheduled.</TableCell></TableRow>
            )}
            {exams.map((x) => (
              <TableRow key={x.id}>
                <TableCell className="pl-6 font-medium">{x.exam_name}</TableCell>
                <TableCell>{x.code}</TableCell>
                <TableCell>{x.exam_date}</TableCell>
                <TableCell>{examTimeRange(x.exam_time, x.exam_end_time)}</TableCell>
                <TableCell>{x.room || '-'}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Delete exam" onClick={() => remove(x.id)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
