import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { FileText, Search } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/documents');
        setDocuments(res.data);
      } catch (err) {
        showToast('Failed to load documents', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <section className="page active" id="page-documents">
        <div className="page-intro">
          <div>
            <p className="eyebrow">STUDENT SERVICES</p>
            <h2>Documents & forms</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-documents">
      <div className="page-intro">
        <div>
          <p className="eyebrow">STUDENT SERVICES</p>
          <h2>Documents & forms</h2>
          <p className="muted">Access commonly used academic documents.</p>
        </div>
        <div className="search-input">
          <Search size={18} />
          <input
            id="documentSearch"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div id="documentGrid" className="document-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
            <h3>No documents</h3>
            <p>No documents match your search.</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="document-item">
              <FileText size={24} style={{ color: '#2563eb' }} />
              <div>
                <h4>{doc.title}</h4>
                <small>{doc.category || 'General'}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Documents;
