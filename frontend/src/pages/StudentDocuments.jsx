import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
        <p className="text-gray-500">Download shared study materials.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No documents available.
                </td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{d.title}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{d.category || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{new Date(d.uploaded_at).toLocaleDateString()}</td>
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
                      <span className="text-gray-400 text-sm">Not available</span>
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
