import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/auth/forgot', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not send the request. Try again later.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>Enter your email. If an account exists, we send a link to choose a new password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</Button>
            </form>
          )}
          <p className="text-center text-sm"><Link className="underline" to="/login">Back to sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
