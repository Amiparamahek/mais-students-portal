import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LecturerAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/announcements').then((r) => setItems(r.data || []));
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/announcements', form);
      setForm({ title: '', content: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">Published announcements are shown to all students.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>Students are notified when you publish.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea required rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Publishing...' : 'Publish'}</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at + 'Z').toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
