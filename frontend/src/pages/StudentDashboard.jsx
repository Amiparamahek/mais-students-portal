import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, gRes, aRes, anRes] = await Promise.all([
        api.get('/courses/my-enrollments'),
        api.get('/grades'),
        api.get('/attendance/my-attendance'),
        api.get('/announcements'),
      ]);
      setCourses(cRes.data || []);
      setGrades(gRes.data || []);
      setAttendance(aRes.data || []);
      setAnnouncements(anRes.data || []).slice(0, 3);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const avgAttendance =
    attendance.length > 0
      ? Math.round(
          (attendance.reduce((sum, a) => sum + (a.classes_attended || 0), 0) /
            attendance.reduce((sum, a) => sum + Math.max(a.classes_held || 0, 1), 0)) *
            100
        ) || 0
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Student Dashboard</h2>
        <p className="text-gray-500">Welcome to your portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="My Classes" value={courses.length} icon="📚" color="bg-green-50 text-green-600" />
        <StatCard title="Attendance" value={avgAttendance + '%'} icon="✅" color="bg-blue-50 text-blue-600" />
        <StatCard title="Recent Grades" value={grades.length} icon="📊" color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Classes</h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-sm">No classes enrolled.</p>
          ) : (
            <ul className="space-y-3">
              {courses.slice(0, 5).map((c) => (
                <li key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="text-sm font-medium">{c.code} - {c.name}</span>
                  <span className="text-xs text-gray-500">{c.semester || '-'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Latest Announcements</h3>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.slice(0, 5).map((a) => (
                <li key={a.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-800">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                  <span className="text-xs text-gray-400 block mt-2">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const [bg, text] = color.split(' ');
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${bg}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <div className="text-xl font-bold text-gray-800">{value}</div>
    </div>
  );
}
