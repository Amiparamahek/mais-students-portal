import React, { useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { formatDateTime } from '../lib/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_VARIANT = { open: 'default', approved: 'secondary', ready: 'secondary', answered: 'secondary', resolved: 'secondary', rejected: 'destructive', closed: 'outline' };

// One request's conversation. Used by students and admins; admins also get the status buttons.
export default function RequestThread({ id, isAdmin, onChanged }) {
  const [data, setData] = useState(null);
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useLiveFetch(() => {
    if (!id) return null;
    return api.get(`/requests/${id}`).then((r) => setData(r.data)).catch((e) => setMessage({ ok: false, text: e.response?.data?.message || 'Could not open this request' }));
  }, [id]);

  if (!id) return <Card><CardContent className="py-10 text-center text-muted-foreground">Choose a request to see the conversation.</CardContent></Card>;
  if (!data) return message ? <p className="text-sm text-destructive">{message.text}</p> : <div className="flex h-40 items-center justify-center"><div className="size-6 animate-spin rounded-full border-b-2 border-foreground" /></div>;

  const { request: r, messages } = data;
  const open = r.status === 'open';

  const send = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/requests/${id}/messages`, { body });
      setBody('');
      const fresh = await api.get(`/requests/${id}`);
      setData(fresh.data);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not send' });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/requests/${id}/status`, { status, note });
      setNote('');
      onChanged?.();
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not change status' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{r.subject}</CardTitle>
          <Badge variant={STATUS_VARIANT[r.status] || 'outline'}>{r.status}</Badge>
        </div>
        <CardDescription>
          {r.category_label}{isAdmin ? ` · ${r.student_name} (${r.student_number || 'no ID'})` : ''} · opened {formatDateTime(r.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
          {messages.map((m) => {
            const mine = isAdmin ? m.sender_role === 'admin' : m.sender_role === 'student';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.kind === 'status' ? 'border border-dashed bg-background' : mine ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                  {m.kind === 'status' && <p className="mb-1 text-xs font-semibold uppercase">Decision</p>}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[11px] ${mine && m.kind !== 'status' ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {m.sender_name} · {formatDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {open ? (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              maxLength={2000}
              placeholder={isAdmin ? 'Reply to the student…' : 'Write your message. You can send one message a minute; the administration replies here.'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex justify-end">
              <Button disabled={busy || body.trim().length === 0} onClick={send}>Send</Button>
            </div>
          </div>
        ) : (
          <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            This request is closed with the decision above.{!isAdmin && ' Open a new request if you need more help.'}
          </p>
        )}

        {isAdmin && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Set the outcome</p>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Optional note the student will see, e.g. Approved. Register at the office by Friday." value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {(r.outcomes || []).map((s) => (
                <Button key={s} size="sm" disabled={busy} onClick={() => setStatus(s)}>Mark {s}</Button>
              ))}
              {open && <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus('closed')}>Close without outcome</Button>}
              {!open && <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus('open')}>Reopen</Button>}
            </div>
          </div>
        )}
        {message && <p className="text-sm text-destructive">{message.text}</p>}
      </CardContent>
    </Card>
  );
}
