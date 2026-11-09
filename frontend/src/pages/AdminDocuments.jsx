import React, { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import api from '../services/api';
import { openDocument } from '../lib/download';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = { title: '', category: '', courseId: '', link: '' };

export default function AdminDocuments() {
  const [docs, setDocs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, c] = await Promise.all([api.get('/documents'), api.get('/admin/courses')]);
    setDocs(d.data || []);
    setCourses(c.data || []);
  };
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load documents'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!file && !form.link) return setError('Choose a file or enter a link');
    const body = new FormData();
    body.append('title', form.title);
    body.append('category', form.category);
    body.append('courseId', form.courseId);
    if (file) body.append('file', file);
    else body.append('fileUrl', form.link);
    setSaving(true);
    try {
      await api.post('/documents', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(emptyForm);
      setFile(null);
      e.target.reset();
      setNotice('Document added.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add document');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!confirm(`Delete "${d.title}"? The file is removed too.`)) return;
    try {
      await api.delete(`/documents/${d.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    }
  };

  const download = async (d) => {
    try {
      await openDocument(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open document');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">Upload files students can download. Attach a document to a class to limit it to that class.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add document</CardTitle>
          <CardDescription>PDF, Word, PowerPoint, Excel, text or image, up to 10 MB. Or paste a link instead.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {notice && <p className="mb-4 rounded-md border bg-muted px-3 py-2 text-sm">{notice}</p>}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Input placeholder="Syllabus, Form, Notes" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Visible to</Label>
              <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Everyone</option>
                {courses.map((c) => <option key={c.id} value={c.id}>Only {c.code} students</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Or link</Label>
              <Input type="url" placeholder="https://..." disabled={!!file} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Uploading...' : 'Add document'}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visible to</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No documents yet.</TableCell></TableRow>}
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-6 font-medium">{d.title}</TableCell>
                <TableCell>{d.category || '-'}</TableCell>
                <TableCell>{d.course_code ? `${d.course_code} only` : 'Everyone'}</TableCell>
                <TableCell className="text-muted-foreground">{d.original_name || (d.file_url ? 'Link' : 'No file')}</TableCell>
                <TableCell className="pr-6 text-right">
                  {(d.stored_name || d.file_url) && (
                    <Button variant="ghost" size="icon-sm" aria-label="Open document" onClick={() => download(d)}><Download /></Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label="Delete document" onClick={() => remove(d)}><Trash2 /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
