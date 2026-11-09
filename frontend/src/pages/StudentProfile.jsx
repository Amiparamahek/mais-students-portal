import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User } from 'lucide-react';

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMessage({ ok: true, text: 'Password updated. Use the new password next time you sign in.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || 'Could not update password' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        if (res.data?.user) {
          setProfile(res.data.user);
          // refresh stored user
          const token = localStorage.getItem('token');
          if (token) login(token, res.data.user);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
        <p className="text-muted-foreground">Your account details.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground text-2xl font-bold">
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{profile?.name || 'Student'}</h3>
            <p className="text-muted-foreground">{profile?.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Role: {profile?.role}</p>
            {profile?.student_id && <p className="text-sm text-muted-foreground">Student ID: {profile.student_id}</p>}
          </div>
        </div>

        <form onSubmit={changePassword} className="max-w-md space-y-4">
          <h4 className="font-semibold text-foreground">Change password</h4>
          {message && (
            <p className={`rounded-md border px-3 py-2 text-sm ${message.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
              {message.text}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
