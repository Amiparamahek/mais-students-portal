import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
        <p className="text-gray-500">Classes you are enrolled in.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Code</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Course Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Credits</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Lecturer</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Semester</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No courses enrolled.
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{c.code}</td>
                  <td className="px-6 py-4 text-gray-600">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{c.credits}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{c.lecturer || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{c.semester || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
