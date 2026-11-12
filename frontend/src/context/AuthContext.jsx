import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Ends the session on the server too, so the token stops working everywhere at once.
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      /* already signed out or offline: clear locally anyway */
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // Which features the administrator has switched on. Defaults to all on until loaded.
  const [features, setFeatures] = useState({ chat: true, checkin: true, security: true, analysis: true });
  useEffect(() => {
    if (!user) return;
    api.get('/settings').then((r) => setFeatures(r.data.features)).catch(() => {});
  }, [user]);

  const value = { user, loading, login, logout, features };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
