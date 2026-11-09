import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, FileText } from 'lucide-react';

export default function StudentDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents')
      .then((res) => setDocuments(res.data || []))
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
        <h2 className="text-2xl font-bold text-foreground">Documents</h2>
        <p className="text-muted-foreground">Download shared study materials.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Title</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Category</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-foreground text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No documents available.
                </td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="hover:bg-muted">
                  <td className="px-6 py-4 text-foreground font-medium">{d.title}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{d.category || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {d.file_url ? (
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        <Download size={16} /> Download
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not available</span>
                    )}
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
