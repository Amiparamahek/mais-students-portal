import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, FileText, Trash2 } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', form);
      setShowForm(false);
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create announcement');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
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
          <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
          <p className="text-muted-foreground">Send announcements to all students.</p>
        </div>
        <button
          onClick={() => {
            setForm({ title: '', content: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Create Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Content</label>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Title</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Content</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {announcements.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No announcements yet.
                </td>
              </tr>
            ) : (
              announcements.map((a) => (
                <tr key={a.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{a.title}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm max-w-xs truncate">{a.content}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
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
