import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/grades/my-grades')
      .then((res) => setGrades(res.data || []))
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
        <h2 className="text-2xl font-bold text-foreground">My Grades</h2>
        <p className="text-muted-foreground">View your assessment results.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Course</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Assessment</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Grade</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No grades published yet.
                </td>
              </tr>
            ) : (
              grades.map((g) => (
                <tr key={g.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{g.course_code || g.course_name || 'Course #' + g.course_id}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{g.assessment}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{g.grade}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(g.grade_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {g.status || 'published'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
