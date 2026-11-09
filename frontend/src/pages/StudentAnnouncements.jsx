import React, { useState, useEffect } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useLiveFetch(() => {
    api.get('/announcements')
      .then((res) => setAnnouncements(res.data || []))
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
        <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
        <p className="text-muted-foreground">Latest news from your college.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No announcements yet.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">{a.title}</h3>
                <p className="text-muted-foreground mb-3">{a.content}</p>
                <span className="text-xs text-muted-foreground">
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
