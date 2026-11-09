import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';

// Search across courses, announcements and documents (FR-11 in the prototype README).
const Search = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ courses: [], announcements: [], documents: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [c, a, d] = await Promise.all([
          API.get('/courses'),
          API.get('/announcements'),
          API.get('/documents'),
        ]);
        setData({ courses: c.data, announcements: a.data, documents: d.data });
      } catch (err) {
        showToast('Failed to load search data', 'error');
      }
    };
    load();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const match = (...fields) => fields.some((f) => (f || '').toLowerCase().includes(q));
    return [
      ...data.courses.filter((c) => match(c.name, c.code))
        .map((c) => ({ type: 'Course', title: c.name, text: c.code })),
      ...data.announcements.filter((a) => match(a.title, a.content))
        .map((a) => ({ type: 'Announcement', title: a.title, text: a.content })),
      ...data.documents.filter((d) => match(d.title, d.category))
        .map((d) => ({ type: 'Document', title: d.title, text: d.category })),
    ];
  }, [query, data]);

  return (
    <section className="page active">
      <div className="search-hero">
        <div className="big-search">
          ⌕ <input
            id="globalSearch"
            placeholder="Try “Cloud Technologies” or “exam schedule”..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p>Start typing to see matching items across the portal.</p>
      </div>

      <div className="global-results">
        {!query.trim() && <div className="empty-state">Enter a search term to see results.</div>}
        {query.trim() && results.length === 0 && <div className="empty-state">No results found.</div>}
        {results.map((r, i) => (
          <div className="result-card" key={`${r.type}-${i}`}>
            <div>
              <strong>{r.title}</strong>
              <p>{r.text}</p>
            </div>
            <span className="status-pill lavender-pill">{r.type}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Search;
