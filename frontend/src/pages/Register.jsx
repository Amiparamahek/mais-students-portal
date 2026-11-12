import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Self sign-up. The account waits for the administration to approve it, which gives the student ID.
export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', programme: '' });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirm) return setMessage({ ok: false, text: 'The two passwords do not match' });
    setBusy(true);
    try {
      const res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, programme: form.programme });
      setMessage({ ok: true, text: res.data.message });
      setForm({ name: '', email: '', password: '', confirm: '', programme: '' });
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not register' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create a student account</CardTitle>
          <CardDescription>An administrator checks your registration and sends your student ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'bg-muted' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}</p>
          )}
          {!message?.ok && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>Full name</Label><Input required maxLength={100} value={form.name} onChange={set('name')} /></div>
              <div className="space-y-2"><Label>University email</Label><Input type="email" required value={form.email} onChange={set('email')} /></div>
              <div className="space-y-2"><Label>Programme</Label><Input placeholder="e.g. Computer Science" maxLength={100} value={form.programme} onChange={set('programme')} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" required minLength={8} placeholder="8+ characters, a letter and a number" value={form.password} onChange={set('password')} /></div>
              <div className="space-y-2"><Label>Repeat password</Label><Input type="password" required minLength={8} value={form.confirm} onChange={set('confirm')} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Sending...' : 'Send registration'}</Button>
            </form>
          )}
          <p className="text-center text-sm"><Link className="underline" to="/login">Back to sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
