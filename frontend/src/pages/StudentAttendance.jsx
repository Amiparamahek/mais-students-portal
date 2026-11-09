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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Attendance</h2>
        <p className="text-muted-foreground">Track your class attendance.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Course</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Classes Held</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Attended</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
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
                  <tr key={a.id} className="hover:bg-muted">
                    <td className="px-6 py-4 text-foreground font-medium">{a.course_code || a.course_name || 'Course #' + a.course_id}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{a.classes_held}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{a.classes_attended}</td>
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
