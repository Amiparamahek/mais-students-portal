import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LecturerClasses() {
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/lecturer/courses').then((r) => setCourses(r.data || [])).catch((e) => setError(e.response?.data?.message || 'Failed to load classes'));
  }, []);

  const toggle = async (id) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    const res = await api.get(`/lecturer/courses/${id}/students`);
    setStudents(res.data || []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My classes</h2>
        <p className="text-muted-foreground">Classes assigned to you and who is enrolled.</p>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {courses.length === 0 && !error && (
        <Card><CardHeader><CardDescription>No classes assigned to you yet. Ask an administrator to assign one.</CardDescription></CardHeader></Card>
      )}

      {courses.map((c) => (
        <Card key={c.id} className="gap-0 py-0">
          <div className="flex items-center justify-between gap-4 p-6">
            <div>
              <CardTitle>{c.code} - {c.name}</CardTitle>
              <CardDescription>{c.semester || '-'}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{c.seats == null ? `${c.enrolled_count} enrolled` : `${c.enrolled_count} / ${c.seats} seats`}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggle(c.id)}>{open === c.id ? 'Hide students' : 'View students'}</Button>
            </div>
          </div>
          {open === c.id && (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="pr-6">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No students enrolled.</TableCell></TableRow>}
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                      <TableCell>{s.student_id || '-'}</TableCell>
                      <TableCell className="pr-6">{s.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
