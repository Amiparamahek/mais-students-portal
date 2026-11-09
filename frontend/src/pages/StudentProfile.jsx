import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User } from 'lucide-react';

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(user);
  const [password, setPassword] = useState('');

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
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500">Your account details.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{profile?.name || 'Student'}</h3>
            <p className="text-gray-500">{profile?.email}</p>
            <p className="text-sm text-gray-400 mt-1">Role: {profile?.role}</p>
            {profile?.student_id && <p className="text-sm text-gray-400">Student ID: {profile.student_id}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
