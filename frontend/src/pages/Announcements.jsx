import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Mail, Plus } from 'lucide-react';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        showToast('Failed to load announcements', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="page active" id="page-announcements">
        <div className="page-intro">
          <div>
            <p className="eyebrow">UNIVERSITY NEWS</p>
            <h2>Announcements</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-announcements">
      <div className="page-intro">
        <div>
          <p className="eyebrow">UNIVERSITY NEWS</p>
          <h2>Announcements</h2>
          <p className="muted">Important updates from lecturers and administration.</p>
        </div>
        {user.role === 'admin' && (
          <button className="primary-btn admin-only" onClick={() => navigate('/admin')}>
            <Plus size={18} /> Create announcement
          </button>
        )}
      </div>

      <div id="announcementList" className="announcement-list">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <Mail size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
            <h3>No announcements</h3>
            <p>There are no announcements at the moment.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="announcement-item">
              <h4>{a.title}</h4>
              <p>{a.content}</p>
              <small>
                By {a.created_by_name || 'Admin'} · {new Date(a.created_at).toLocaleDateString()}
              </small>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Announcements;
