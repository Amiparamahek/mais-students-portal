import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then((res) => setAnnouncements(res.data || []))
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
        <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
        <p className="text-gray-500">Latest news from your college.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No announcements yet.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{a.title}</h3>
                <p className="text-gray-600 mb-3">{a.content}</p>
                <span className="text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
