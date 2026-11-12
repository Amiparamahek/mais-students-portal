import axios from 'axios';
import { deviceId } from '../lib/device';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const device = deviceId();
    if (device) config.headers['X-Device-Id'] = device;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Tell the login page why (e.g. signed in on another device). Only the server's
      // message is shown, never a token.
      try {
        sessionStorage.setItem('signout_notice', error.response.data?.message || 'Your session has ended. Sign in again.');
      } catch (_) {
        /* storage blocked */
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
