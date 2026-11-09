import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/grades')
      .then((res) => setGrades(res.data || []))
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
        <h2 className="text-2xl font-bold text-gray-800">My Grades</h2>
        <p className="text-gray-500">View your assessment results.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Course</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Assessment</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Grade</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {grades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No grades published yet.
                </td>
              </tr>
            ) : (
              grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{g.course_code || g.course_name || 'Course #' + g.course_id}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{g.assessment}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">{g.grade}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
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
