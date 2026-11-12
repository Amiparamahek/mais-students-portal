import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Opened from the link in the email. The token is read from the address and sent once.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setMessage({ ok: false, text: 'The two passwords do not match' });
    setBusy(true);
    try {
      const res = await api.post('/auth/reset', { token, password });
      setMessage({ ok: true, text: res.data.message });
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not reset the password' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
          <CardDescription>8+ characters, with a letter and a number. The link works once and for 30 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>}
          {!token ? (
            <p className="text-sm text-destructive">This page needs the link from your email.</p>
          ) : !message?.ok && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>New password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>Repeat new password</Label><Input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Saving...' : 'Save new password'}</Button>
            </form>
          )}
          <p className="text-center text-sm"><Link className="underline" to="/login">Go to sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
