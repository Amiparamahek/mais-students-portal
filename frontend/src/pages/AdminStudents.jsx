import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'demo123',
    student_id: '',
    faculty: '',
    programme: '',
    academic_year: '',
    role: 'student',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/students/${editingId}`, form);
      } else {
        await api.post('/admin/students', form);
      }
      setShowForm(false);
      setForm({
        name: '',
        email: '',
        password: 'demo123',
        student_id: '',
        faculty: '',
        programme: '',
        academic_year: '',
        role: 'student',
      });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save student');
    }
  };

  const editStudent = (student) => {
    setEditingId(student.id);
    setForm({ ...student });
    setShowForm(true);
  };

  const deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/students/${id}/toggle-active`, {
        is_active: !currentStatus,
      });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
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
          <h2 className="text-2xl font-bold text-gray-800">Manage Students</h2>
          <p className="text-gray-500">Add, edit, or remove student accounts.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingId(null);
              setForm({
                name: '',
                email: '',
                password: 'demo123',
                student_id: '',
                faculty: '',
                programme: '',
                academic_year: '',
                role: 'student',
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus size={18} /> Add Student
          </button>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
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
            {editingId ? 'Edit Student' : 'Add New Student'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <input
                type="text"
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programme
              </label>
              <input
                type="text"
                value={form.programme}
                onChange={(e) => setForm({ ...form, programme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3 flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {editingId ? 'Update Student' : 'Create Student'}
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

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Student ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Programme</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Year</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.email}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{s.student_id || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{s.programme || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{s.academic_year || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.is_active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {s.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => editStudent(s)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      <Edit2 size={16} className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(s.id, s.is_active !== false)}
                      className={`text-sm font-medium mr-3 ${
                        s.is_active === false ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'
                      }`}
                    >
                      {s.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      onClick={() => deleteStudent(s.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 size={16} className="inline mr-1" /> Delete
                    </button>
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
