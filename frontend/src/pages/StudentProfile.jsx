import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
        <p className="text-muted-foreground">Your account details.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{user?.name || 'Student'}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Role: {user?.role}</p>
            {user?.student_id && <p className="text-sm text-muted-foreground">Student ID: {user.student_id}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
            />
          </div>
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => {
              alert('Password update feature coming soon!');
            }}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
