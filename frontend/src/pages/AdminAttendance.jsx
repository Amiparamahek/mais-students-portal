import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, CheckCircle, XCircle } from 'lucide-react';

export default function AdminAttendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForCourse = async (courseId) => {
    try {
      const res = await api.get(`/admin/courses/${courseId}/students`);
      const studs = res.data || [];
      setStudents(studs);
      // Default everyone to present
      const initial = {};
      studs.forEach((s) => {
        initial[s.id] = true;
      });
      setAttendance(initial);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleCourseChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedCourse(id);
    loadStudentsForCourse(id);
  };

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const saveAttendance = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, present]) => ({
        student_id: parseInt(studentId),
        course_id: selectedCourse,
        present,
      }));
      await api.post('/admin/attendance', { date, records });
      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mark Attendance</h2>
        <p className="text-muted-foreground">Select a class and mark present/absent for each student.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Class</label>
            <select
              value={selectedCourse || ''}
              onChange={handleCourseChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
            >
              <option value="">-- Choose a class --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ml-2 px-3 py-2 border border-border rounded-md focus:outline-none "
            />
          </div>
        </div>

        {selectedCourse && students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-foreground">Student</th>
                  <th className="px-6 py-3 text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-3 text-sm font-semibold text-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => {
                  const isPresent = attendance[s.id] !== false;
                  return (
                    <tr key={s.id} className="hover:bg-muted">
                      <td className="px-6 py-4 text-foreground font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{s.email}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => toggleAttendance(s.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                              isPresent
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {isPresent ? (
                              <CheckCircle size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                          </button>
                          <span className={`text-sm font-medium ${
                            isPresent ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : selectedCourse && students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students enrolled in this class.
          </div>
        ) : null}

        {selectedCourse && students.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted-foreground text-primary-foreground px-6 py-2 rounded-md text-sm font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
