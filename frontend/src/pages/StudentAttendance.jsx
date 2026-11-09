import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/my-attendance')
      .then((res) => setAttendance(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
        <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
        <p className="text-gray-500">Track your class attendance.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Course</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Classes Held</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Attended</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No attendance records.
                </td>
              </tr>
            ) : (
              attendance.map((a) => {
                const pct = a.classes_held > 0
                  ? Math.round((a.classes_attended / a.classes_held) * 100)
                  : 0;
                const isLow = pct < 75;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{a.course_code || a.course_name || 'Course #' + a.course_id}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{a.classes_held}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{a.classes_attended}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
