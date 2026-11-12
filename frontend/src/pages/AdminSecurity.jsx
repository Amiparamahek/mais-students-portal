import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Approved, Clock } from '@duo-icons/react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { formatDateTime } from '../lib/date';
import { EVENT_LABELS, SEVERITY_VARIANT, noteOf, shortDevice } from '../lib/security';
import StatCard from '../components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TABS = [
  { key: 'open', label: 'Open flags' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'audit', label: 'Audit log' },
];

const Who = ({ id, name, number }) =>
  id ? (
    <Link to={`/admin/students/${id}`} className="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground">
      {name || `#${id}`}
    </Link>
  ) : (
    <span className="text-muted-foreground">-</span>
  );

export default function AdminSecurity() {
  const [tab, setTab] = useState('open');
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState(null); // { id, status }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useLiveFetch(() => {
    const req = [api.get('/admin/security/summary').then((r) => setSummary(r.data))];
    if (tab === 'audit') req.push(api.get('/admin/security/audit', { params: { limit: 150 } }).then((r) => setAudit(r.data)));
    else req.push(api.get('/admin/security/events', { params: { status: tab } }).then((r) => setEvents(r.data)));
    return Promise.all(req)
      .then(() => setError(''))
      .catch((e) => setError(e.response?.data?.message || 'Could not load security data'));
  }, [tab]);

  const decide = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/security/events/${deciding.id}/review`, { status: deciding.status, note });
      setDeciding(null);
      setNote('');
      const [s, e] = await Promise.all([api.get('/admin/security/summary'), api.get('/admin/security/events', { params: { status: tab } })]);
      setSummary(s.data);
      setEvents(e.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save the decision');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security</h2>
        <p className="text-muted-foreground">Possible cheating and account misuse. A flag never blocks a student by itself; review each one and say what you decided.</p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Open high-severity" value={summary?.open_high ?? '-'} icon={AlertOctagon} />
        <StatCard title="Open medium" value={summary?.open_medium ?? '-'} icon={AlertTriangle} />
        <StatCard title="Failed sign-ins (24 h)" value={summary?.failed_logins_24h ?? '-'} icon={Approved} />
        <StatCard title="Active sessions now" value={summary?.active_sessions_now ?? '-'} icon={Clock} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'default' : 'outline'} size="sm" onClick={() => { setTab(t.key); setDeciding(null); }}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab !== 'audit' ? (
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>{TABS.find((t) => t.key === tab).label}</CardTitle>
            <CardDescription>Most serious first. Click a name to open the student's full record.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Severity</TableHead>
                <TableHead>What happened</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Lecture / device</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="pr-6 text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nothing here.</TableCell></TableRow>}
              {events.map((e) => (
                <React.Fragment key={e.id}>
                  <TableRow>
                    <TableCell className="pl-6"><Badge variant={SEVERITY_VARIANT[e.severity]}>{e.severity}</Badge></TableCell>
                    <TableCell className="max-w-72">
                      <p className="font-medium">{EVENT_LABELS[e.type] || e.type}</p>
                      {noteOf(e.details) && <p className="text-xs text-muted-foreground">{noteOf(e.details)}</p>}
                    </TableCell>
                    <TableCell>
                      <Who id={e.user_id} name={e.student_name} />
                      {e.other_user_id && <> and <Who id={e.other_user_id} name={e.other_name} /></>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.course_code ? `${e.course_code} ${e.lecture_time || ''} · ${e.class_date || ''}` : '-'}
                      <div className="text-xs text-muted-foreground">Device {shortDevice(e.device_id)} · {e.ip || 'no address'}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" title={formatDateTime(e.created_at)}>{formatDateTime(e.created_at)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      {e.status === 'open' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setDeciding({ id: e.id, status: 'reviewed' }); setNote(''); }}>Reviewed</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setDeciding({ id: e.id, status: 'dismissed' }); setNote(''); }}>Dismiss</Button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-muted-foreground">
                          <Badge variant="outline">{e.status}</Badge>
                          {e.review_note && <p className="mt-1 max-w-56 whitespace-normal">"{e.review_note}"</p>}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {deciding && deciding.id === e.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/40 pl-6 pr-6">
                        <div className="flex flex-wrap items-center gap-3 py-2">
                          <span className="text-sm">Mark as <strong>{deciding.status}</strong>. Why?</span>
                          <input
                            className="min-w-72 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="e.g. Checked with the lecturer; they were sitting together"
                            value={note}
                            maxLength={500}
                            onChange={(ev) => setNote(ev.target.value)}
                          />
                          <Button size="sm" disabled={busy || note.trim().length < 3} onClick={decide}>Save decision</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeciding(null)}>Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>Audit log</CardTitle>
            <CardDescription>Every change an admin made, newest first. Passwords are never stored here.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="pr-6">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No changes recorded yet.</TableCell></TableRow>}
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-6 text-sm">{formatDateTime(a.created_at)}</TableCell>
                  <TableCell>{a.admin_name || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{a.method} {a.path.replace('/api/', '')}</TableCell>
                  <TableCell className="pr-6 max-w-96 truncate font-mono text-xs text-muted-foreground" title={a.detail}>{a.detail || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
