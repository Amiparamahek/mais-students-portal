import React, { useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import RequestThread from '../components/RequestThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StudentRequests() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', message: '' });
  const [message, setMessage] = useState(null);

  useLiveFetch(() => api.get('/requests').then((r) => setList(r.data)).catch(() => {}), []);
  useLiveFetch(() => api.get('/requests/categories').then((r) => { setCategories(r.data); if (!form.category && r.data[0]) setForm((f) => ({ ...f, category: r.data[0].key })); }).catch(() => {}), []);

  const send = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post('/requests', form);
      setMessage({ ok: true, text: res.data.message });
      setForm({ ...form, subject: '', message: '' });
      setCreating(false);
      setSelected(res.data.id);
      api.get('/requests').then((r) => setList(r.data));
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not send' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Requests</h2>
          <p className="text-muted-foreground">Ask the administration for approval, a document, or help. Each request has one conversation; you get a notification when there is a reply, not one for every message.</p>
        </div>
        <Button onClick={() => { setCreating(!creating); setMessage(null); }}>{creating ? 'Cancel' : 'New request'}</Button>
      </div>

      {message && <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>}

      {creating && (
        <Card>
          <CardHeader><CardTitle>New request</CardTitle><CardDescription>Keep it short and specific. Limits: 5 open requests at a time, 10 new per day.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={send} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input required minLength={3} maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Message</Label>
                <textarea required minLength={5} maxLength={2000} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div className="md:col-span-2"><Button type="submit">Send request</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="gap-0 py-0">
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No requests yet.</p>}
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id}>
                <button onClick={() => { setSelected(r.id); setCreating(false); }} className={`flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-accent ${selected === r.id ? 'bg-accent' : ''}`}>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${r.unread ? 'font-semibold' : ''}`}>{r.subject}</span>
                    <span className="block text-xs text-muted-foreground">{r.category}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.unread && <Badge>New reply</Badge>}
                    <Badge variant="outline">{r.status}</Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <RequestThread id={selected} isAdmin={false} />
      </div>
    </div>
  );
}
