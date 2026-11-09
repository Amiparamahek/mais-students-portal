import React, { useEffect, useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const empty = { studentId: '', courseId: '', assessment: '', grade: '', status: 'published' };

export default function AdminGrades() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [g, s, c] = await Promise.all([api.get('/grades'), api.get('/admin/students'), api.get('/admin/courses')]);
    setGrades(g.data || []);
    setStudents(s.data || []);
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
      await api.post('/grades', { ...form, studentId: Number(form.studentId), courseId: Number(form.courseId) });
      setForm({ ...empty, studentId: form.studentId, courseId: form.courseId });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this grade?')) return;
    try {
      await api.delete(`/grades/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete grade');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Grades</h2>
        <p className="text-muted-foreground">Published grades appear on the student's Grades page immediately.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add grade</CardTitle>
          <CardDescription>The student gets a notification when a grade is published.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Student</Label>
              <select required value={form.studentId} onChange={set('studentId')}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
              <Label>Assessment</Label>
              <Input required placeholder="Midterm" value={form.assessment} onChange={set('assessment')} />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Input required placeholder="A" value={form.grade} onChange={set('grade')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={set('status')}>
                <option value="published">Published</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save grade'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No grades yet.</TableCell></TableRow>
            )}
            {grades.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="pl-6 font-medium">{g.student_name}</TableCell>
                <TableCell>{g.course_code}</TableCell>
                <TableCell>{g.assessment}</TableCell>
                <TableCell className="font-semibold">{g.grade}</TableCell>
                <TableCell><Badge variant={g.status === 'published' ? 'default' : 'secondary'}>{g.status}</Badge></TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Delete grade" onClick={() => remove(g.id)}>
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
