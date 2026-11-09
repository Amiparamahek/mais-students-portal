import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/my-enrollments')
      .then((res) => setCourses(res.data || []))
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
        <h2 className="text-2xl font-bold text-foreground">My Courses</h2>
        <p className="text-muted-foreground">Classes you are enrolled in.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Code</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Course Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Credits</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Lecturer</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Semester</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No courses enrolled.
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{c.code}</td>
                  <td className="px-6 py-4 text-muted-foreground">{c.name}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{c.credits}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{c.lecturer || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{c.semester || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
