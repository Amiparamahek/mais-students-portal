import React, { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const empty = {
  code: '', name: '', credits: 6, semester: '', description: '', lecturer: '',
  seats: '', prerequisite_course_id: '',
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [enrol, setEnrol] = useState({ courseId: '', studentId: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [c, p] = await Promise.all([api.get('/admin/courses'), api.get('/admin/students')]);
    setCourses(c.data || []);
    setPeople(p.data || []);
  };
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load classes'));
  }, []);

  const students = people.filter((p) => p.role === 'student');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code || '',
      name: c.name || '',
      credits: c.credits ?? 6,
      semester: c.semester || '',
      description: c.description || '',
      lecturer: c.lecturer || '',
      seats: c.seats ?? '',
      prerequisite_course_id: c.prerequisite_course_id ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const body = {
      ...form,
      credits: Number(form.credits) || 0,
      seats: form.seats === '' ? null : Number(form.seats),
      prerequisite_course_id: form.prerequisite_course_id === '' ? null : Number(form.prerequisite_course_id),
    };
    try {
      if (editingId) await api.put(`/admin/courses/${editingId}`, body);
      else await api.post('/admin/courses', body);
      setForm(empty);
      setEditingId(null);
      setNotice(editingId ? 'Class updated.' : 'Class created.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete ${c.code}? Its enrolments, grades and attendance will be removed.`)) return;
    try {
      await api.delete(`/admin/courses/${c.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const enrolStudent = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/courses/enroll', { courseId: Number(enrol.courseId), studentId: Number(enrol.studentId) });
      setNotice('Student enrolled.');
      setEnrol({ ...enrol, studentId: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not enrol student');
    }
  };

  const seatText = (c) => (c.seats == null ? `${c.enrolled_count} enrolled` : `${c.enrolled_count} / ${c.seats}`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
        <p className="text-muted-foreground">Create classes, set the lecturer name, seats and prerequisites.</p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {notice && <p className="rounded-md border bg-muted px-3 py-2 text-sm">{notice}</p>}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit class' : 'Add class'}</CardTitle>
          <CardDescription>Seats empty means unlimited. A prerequisite needs a published grade before a student can enrol.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2"><Label>Code</Label><Input required value={form.code} onChange={set('code')} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Name</Label><Input required value={form.name} onChange={set('name')} /></div>
            <div className="space-y-2"><Label>Credits</Label><Input type="number" min="0" value={form.credits} onChange={set('credits')} /></div>
            <div className="space-y-2"><Label>Lecturer name</Label><Input value={form.lecturer} onChange={set('lecturer')} /></div>
            <div className="space-y-2"><Label>Semester</Label><Input placeholder="Winter 2026/27" value={form.semester} onChange={set('semester')} /></div>
            <div className="space-y-2"><Label>Seats</Label><Input type="number" min="0" placeholder="Unlimited" value={form.seats} onChange={set('seats')} /></div>
            <div className="space-y-2">
              <Label>Prerequisite</Label>
              <select value={form.prerequisite_course_id} onChange={set('prerequisite_course_id')}>
                <option value="">None</option>
                {courses.filter((c) => c.id !== editingId).map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-4"><Label>Description</Label><Input value={form.description} onChange={set('description')} /></div>
            <div className="flex gap-3 md:col-span-4">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create class'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrol a student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={enrolStudent} className="grid gap-4 md:grid-cols-3">
            <select required value={enrol.courseId} onChange={(e) => setEnrol({ ...enrol, courseId: e.target.value })}>
              <option value="">Choose class</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} ({seatText(c)})</option>)}
            </select>
            <select required value={enrol.studentId} onChange={(e) => setEnrol({ ...enrol, studentId: e.target.value })}>
              <option value="">Choose student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button type="submit" variant="outline">Enrol</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Prerequisite</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No classes yet.</TableCell></TableRow>
            )}
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-6 font-medium">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.lecturer || <Badge variant="outline">Not set</Badge>}</TableCell>
                <TableCell>
                  <Badge variant={c.seats != null && c.enrolled_count >= c.seats ? 'destructive' : 'secondary'}>{seatText(c)}</Badge>
                </TableCell>
                <TableCell>{c.prerequisite_code || '-'}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit class" onClick={() => startEdit(c)}><Pencil /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete class" onClick={() => remove(c)}><Trash2 /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
