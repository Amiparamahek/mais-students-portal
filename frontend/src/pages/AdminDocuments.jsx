import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, FileText, Trash2, Download } from 'lucide-react';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', file_url: '', category: '' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents', form);
      setShowForm(false);
      setForm({ title: '', file_url: '', category: '' });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add document');
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
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
          <h2 className="text-2xl font-bold text-foreground">Documents</h2>
          <p className="text-muted-foreground">Manage shared documents for students.</p>
        </div>
        <button
          onClick={() => {
            setForm({ title: '', file_url: '', category: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus size={18} /> Add Document
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add Document</h3>
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
              <label className="block text-sm font-medium text-foreground mb-1">File URL</label>
              <input
                type="text"
                placeholder="https://example.com/file.pdf"
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Syllabus, Notes, Assignment"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none "
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Document
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
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Category</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No documents yet.
                </td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{d.title}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{d.category || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {d.file_url && (
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-foreground/70 text-sm font-medium mr-3"
                      >
                        <Download size={16} className="inline mr-1" /> Download
                      </a>
                    )}
                    <button
                      onClick={() => deleteDocument(d.id)}
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
