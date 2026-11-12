import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentFindCourses() {
  const [q, setQ] = useState('');
  const [courses, setCourses] = useState([]);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [options, setOptions] = useState([]);
  const [pick, setPick] = useState('');

  const load = (term) =>
    api
      .get('/courses/search', { params: { q: term } })
      .then((r) => setCourses(r.data || []))
      .catch((e) => setMessage({ ok: false, text: e.response?.data?.message || 'Search failed' }));

  // Full course list for the drop-down (the search box below filters the table only).
  const loadOptions = () =>
    api
      .get('/courses/search', { params: { q: '' } })
      .then((r) => setOptions(r.data || []))
      .catch(() => {});

  useEffect(() => {
    load('');
    loadOptions();
  }, []);

  // Search as the student types.
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const enrol = async (c) => {
    setBusy(c.id);
    setMessage(null);
    try {
      await api.post('/courses/enroll', { courseId: c.id });
      setMessage({ ok: true, text: `Registered for ${c.code}.` });
      setPick('');
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Registration failed' });
    } finally {
      setBusy(null);
      load(q);
      loadOptions();
    }
  };

  const drop = async (c) => {
    if (!confirm(`Drop ${c.code}?`)) return;
    setBusy(c.id);
    setMessage(null);
    try {
      await api.delete(`/courses/enroll/${c.id}`);
      setMessage({ ok: true, text: `Dropped ${c.code}.` });
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not drop class' });
    } finally {
      setBusy(null);
      load(q);
      loadOptions();
    }
  };

  const seatsLeft = (c) => (c.seats == null ? 'Open' : Math.max(c.seats - c.enrolled_count, 0) + ' left');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Find courses</h2>
        <p className="text-muted-foreground">Search by course code or name, then register if seats are free and prerequisites are met.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="h-9 min-w-72 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Choose a course to register</option>
          {options.map((c) => {
            const full = c.seats != null && c.enrolled_count >= c.seats;
            return (
              <option key={c.id} value={c.id} disabled={!!c.is_enrolled || full}>
                {c.code} - {c.name}{c.is_enrolled ? ' (registered)' : full ? ' (full)' : ''}
              </option>
            );
          })}
        </select>
        <Button disabled={!pick || busy !== null} onClick={() => enrol(options.find((c) => String(c.id) === pick))}>
          Register selected
        </Button>
      </div>

      <Input placeholder="e.g. CT101 or Database" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      {message && (
        <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Prerequisite</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No courses match.</TableCell></TableRow>}
            {courses.map((c) => {
              const full = c.seats != null && c.enrolled_count >= c.seats;
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.lecturer_name || c.lecturer || '-'}</TableCell>
                  <TableCell><Badge variant={full ? 'destructive' : 'secondary'}>{seatsLeft(c)}</Badge></TableCell>
                  <TableCell>{c.prerequisite_code ? <Badge variant="outline">{c.prerequisite_code} graded</Badge> : '-'}</TableCell>
                  <TableCell className="pr-6 text-right">
                    {c.is_enrolled ? (
                      <Button variant="outline" size="sm" disabled={busy === c.id} onClick={() => drop(c)}>Drop</Button>
                    ) : (
                      <Button size="sm" disabled={busy === c.id || full} onClick={() => enrol(c)}>
                        {full ? 'Full' : 'Register'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
