import React, { useEffect, useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { joinSlot, splitSlot } from '../lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const empty = { course_id: '', day: 'Monday', start: '09:00', end: '10:30', room: '' };

export default function AdminTimetable() {
  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [t, c] = await Promise.all([api.get('/admin/timetable'), api.get('/admin/courses')]);
    setSlots(t.data || []);
    setCourses(c.data || []);
  };
  useLiveFetch(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load timetable'));
  }, []);

  const startEdit = (s) => {
    const { start, end } = splitSlot(s.time);
    setEditingId(s.id);
    setForm({ course_id: s.course_id, day: s.day, start, end, room: s.room || '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.end <= form.start) return setError('End time must be after start time');
    setSaving(true);
    const body = { course_id: Number(form.course_id), day: form.day, time: joinSlot(form.start, form.end), room: form.room };
    try {
      if (editingId) await api.put(`/admin/timetable/${editingId}`, body);
      else await api.post('/admin/timetable', body);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save slot');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await api.delete(`/admin/timetable/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Timetable</h2>
        <p className="text-muted-foreground">Weekly class times. Students see the slots for their own classes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit slot' : 'Add slot'}</CardTitle>
          <CardDescription>Times are campus local time.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Class</Label>
              <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Choose class</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Day</Label>
              <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="time" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input type="time" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input placeholder="A1" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </div>
            <div className="flex gap-3 md:col-span-6">
              <Button type="submit" disabled={saving}>{editingId ? 'Save slot' : 'Add slot'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Class</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No timetable slots yet.</TableCell></TableRow>}
            {slots.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="pl-6 font-medium">{s.course_code} - {s.course_name}</TableCell>
                <TableCell>{s.day}</TableCell>
                <TableCell>{s.time}</TableCell>
                <TableCell>{s.room || '-'}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit slot" onClick={() => startEdit(s)}><Pencil /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete slot" onClick={() => remove(s.id)}><Trash2 /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
