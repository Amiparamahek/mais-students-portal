import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Switch on or off features for everyone. Saved on the server, enforced by the server.
export default function AdminSettings() {
  const { features: liveFeatures } = useAuth();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/admin/settings').then((r) => {
      setData(r.data);
      setDraft(r.data.features);
    });
  useEffect(() => {
    load().catch((e) => setMessage({ ok: false, text: e.response?.data?.message || 'Could not load settings' }));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/admin/settings', { features: draft });
      setDraft(res.data.features);
      setMessage({ ok: true, text: 'Saved. Students and staff see the change on their next page load.' });
      await load();
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="flex h-64 items-center justify-center"><div className="size-8 animate-spin rounded-full border-b-2 border-foreground" /></div>;
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.features);
  const s = data.server;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Server-wide switches. Turning a feature off makes the server refuse it, not just hide it.</p>
      </div>

      {message && (
        <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Currently on for this session: {Object.entries(liveFeatures || {}).filter(([, v]) => v).length} of {Object.keys(data.labels).length}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(data.labels).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">Default: {data.defaults[key] ? 'on' : 'off'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={draft[key] ? 'secondary' : 'destructive'}>{draft[key] ? 'On' : 'Off'}</Badge>
                <input type="checkbox" className="size-5" checked={!!draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} aria-label={label} />
              </div>
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" disabled={!dirty} onClick={() => setDraft(data.features)}>Discard</Button>
            <Button disabled={!dirty || saving} onClick={save}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardHeader className="pt-6">
          <CardTitle>Server (read-only)</CardTitle>
          <CardDescription>Set in the server's configuration file. Secrets are never shown here.</CardDescription>
        </CardHeader>
        <Table>
          <TableBody>
            {[
              ['Environment', s.environment],
              ['Node version', s.node_version],
              ['Platform', s.platform],
              ['Running for', `${s.uptime_hours} hours`],
              ['Database file', s.database_file],
              ['Allowed browser origins', s.cors_origins.join(', ')],
              ['Behind a proxy (trust proxy)', s.trust_proxy],
              ['Campus network ranges', s.campus_ip_ranges.length ? s.campus_ip_ranges.join(', ') : 'Not set (off-campus check is off)'],
              ['Check-in from off campus', s.off_campus_checkin === 'block' ? 'Refused' : 'Allowed and flagged'],
              ['Sign-in length', s.session_length],
              ['Signing key', s.jwt_secret],
            ].map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="pl-6 text-muted-foreground">{k}</TableCell>
                <TableCell className="pr-6 font-mono text-xs break-all">{String(v)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browser-only settings</CardTitle>
          <CardDescription>These are stored on each person's own device and are not sent to the server: the dark-mode toggle in the header and the sign-out notice.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
