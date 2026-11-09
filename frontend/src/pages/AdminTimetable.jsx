import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    course_id: '',
    day: 'Monday',
    time: '09:00',
    room: '',
    week: 'All',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get('/admin/timetable'),
        api.get('/admin/courses'),
      ]);
      setTimetable(tRes.data || []);
      setCourses(cRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/timetable/${editingId}`, form);
      } else {
        await api.post('/admin/timetable', form);
      }
      setShowForm(false);
      setForm({ course_id: '', day: 'Monday', time: '09:00', room: '', week: 'All' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save timetable entry');
    }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await api.delete(`/admin/timetable/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const courseName = (id) => {
    const c = courses.find((x) => x.id === id);
    return c ? `${c.code} - ${c.name}` : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Class Timetable</h2>
          <p className="text-muted-foreground">Manage weekly class schedule.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ course_id: '', day: 'Monday', time: '09:00', room: '', week: 'All' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus size={18} /> Add Slot
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'Edit Slot' : 'Add Timetable Slot'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Course</label>
              <select
                required
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              >
                <option value="">-- Select course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Day</label>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Room</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              />
            </div>
            <div className="md:col-span-4 flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                {editingId ? 'Update Slot' : 'Create Slot'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 bg-secondary hover:bg-accent text-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Course</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Day</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Time</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Room</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Week</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {timetable.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No timetable slots yet.
                </td>
              </tr>
            ) : (
              timetable.map((slot) => (
                <tr key={slot.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{courseName(slot.course_id)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{slot.day}</td>
                  <td className="px-6 py-4 text-muted-foreground">{slot.time}</td>
                  <td className="px-6 py-4 text-muted-foreground">{slot.room || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{slot.week || 'All'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        const c = courses.find((x) => x.id === slot.course_id);
                        setEditingId(slot.id);
                        setForm({
                          course_id: slot.course_id,
                          day: slot.day,
                          time: slot.time,
                          room: slot.room || '',
                          week: slot.week || 'All',
                        });
                        setShowForm(true);
                      }}
                      className="text-foreground hover:text-foreground/70 text-sm font-medium mr-3"
                    >
                      <Edit2 size={16} className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => deleteSlot(slot.id)}
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
