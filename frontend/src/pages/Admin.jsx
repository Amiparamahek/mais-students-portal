import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { Mail, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const nRes = await API.get('/announcements');
        setAnnouncements(nRes.data);
      } catch (err) {
        showToast('Failed to load announcements', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const createAnnouncement = async (e) => {
    e.preventDefault();
    const title = e.target.elements.title.value;
    const content = e.target.elements.content.value;
    try {
      await API.post('/admin/announcements', { title, content });
      const res = await API.get('/announcements');
      setAnnouncements(res.data);
      showToast('Announcement created', 'success');
      e.target.reset();
    } catch (err) {
      showToast('Failed to create announcement', 'error');
    }
  };

  if (loading) {
    return (
      <section className="page active" id="page-admin">
        <div className="page-intro">
          <div>
            <p className="eyebrow">PORTAL CONTROL</p>
            <h2>Administration</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-admin">
      <div className="page-intro">
        <div>
          <p className="eyebrow">PORTAL CONTROL</p>
          <h2>Administration</h2>
          <p className="muted">Manage announcements and view your profile.</p>
        </div>
        <span className="status-pill peach-pill">Admin</span>
      </div>

      <div className="profile-layout">
        <article className="panel profile-card">
          <div className="profile-avatar">
            {user?.name?.split(' ').map((n) => n[0]).join('') || 'AU'}
          </div>
          <h3>{user?.name}</h3>
          <p className="muted">Administrator · {user?.programme}</p>
          <span className="status-pill blue">Admin</span>
          <div className="profile-meta">
            <span>Admin ID</span>
            <strong>{user?.studentId || '-'}</strong>
            <span>Faculty</span>
            <strong>{user?.faculty || '-'}</strong>
          </div>
        </article>

        <article className="panel">
          <h3>Personal information</h3>
          <div className="detail-grid">
            <div>
              <small>Full name</small>
              <strong>{user?.name}</strong>
            </div>
            <div>
              <small>Email</small>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <small>Role</small>
              <strong>{user?.role}</strong>
            </div>
            <div>
              <small>Study programme</small>
              <strong>{user?.programme || '-'}</strong>
            </div>
            <div>
              <small>Academic year</small>
              <strong>{user?.academic_year || '-'}</strong>
            </div>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>Create Announcement</h3>
            <p className="muted">Publish updates visible to all students.</p>
          </div>
        </div>
        <form className="stack-form" onSubmit={createAnnouncement} style={{ maxWidth: '500px' }}>
          <label>
            Title
            <input name="title" required placeholder="Announcement title" />
          </label>
          <label>
            Content
            <textarea name="content" required rows={3} placeholder="Announcement content" />
          </label>
          <button className="primary-btn" type="submit">
            <Plus size={18} /> Publish announcement
          </button>
        </form>

        <div className="announcement-list" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Published announcements ({announcements.length})</h3>
          {announcements.length === 0 ? (
            <p className="muted">No announcements published yet.</p>
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
      </article>
    </section>
  );
};

export default Admin;
