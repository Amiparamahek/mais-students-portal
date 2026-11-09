import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Search, User } from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    credits: 3,
    lecturer: '',
    semester: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/students'),
      ]);
      setCourses(cRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, form);
      } else {
        await api.post('/admin/courses', form);
      }
      setShowForm(false);
      setForm({ code: '', name: '', credits: 3, lecturer: '', semester: '', description: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save course');
    }
  };

  const editCourse = (course) => {
    setEditingId(course.id);
    setForm({ ...course });
    setShowForm(true);
  };

  const deleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const enrollStudent = async (courseId, studentId) => {
    try {
      await api.post('/courses/enroll', { courseId, studentId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Classes</h2>
          <p className="text-gray-500">Create and manage courses, enroll students.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ code: '', name: '', credits: 3, lecturer: '', semester: '', description: '' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus size={18} /> Add Class
          </button>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Class' : 'Add New Class'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
              <input
                type="text"
                value={form.lecturer}
                onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-3 flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {editingId ? 'Update Class' : 'Create Class'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Code</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Credits</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Lecturer</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Semester</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Enrolled</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No classes found
                </td>
              </tr>
            ) : (
              filteredCourses.map((c) => {
                const enrolledStudents = students.filter(
                  (s) => s.enrolledCourses?.includes(c.id) || s.enrolled_courses?.includes(c.id)
                );
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{c.code}</td>
                    <td className="px-6 py-4 text-gray-600">{c.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{c.credits}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{c.lecturer || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{c.semester || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {enrolledStudents.length}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => editCourse(c)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                      >
                        <Edit2 size={16} className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(c.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <Trash2 size={16} className="inline mr-1" /> Delete
                      </button>
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
