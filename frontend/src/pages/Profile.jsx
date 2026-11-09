import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    programme: user?.programme || '',
    academicYear: user?.academic_year || '',
    studyStatus: user?.study_status || '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        programme: user.programme || '',
        academicYear: user.academic_year || '',
        studyStatus: user.study_status || '',
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateProfile({
        name: formData.name,
        email: formData.email,
      });
      showToast('Profile updated successfully', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page active" id="page-profile">
      <div className="page-intro">
        <div>
          <p className="eyebrow">YOUR INFORMATION</p>
          <h2>My profile</h2>
          <p className="muted">View and update your personal and academic information.</p>
        </div>
        <button className="secondary-btn" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit profile'}
        </button>
      </div>

      <div className="profile-layout">
        <article className="panel profile-card">
          <div className="profile-avatar">
            {user?.name?.split(' ').map((n) => n[0]).join('') || 'MA'}
          </div>
          <h3>{formData.name}</h3>
          <p className="muted">{user?.role === 'admin' ? 'Administrator' : 'Student'} · {formData.programme}</p>
          <span className={`status-pill ${user?.role === 'admin' ? 'blue' : 'green'}`}>
            {user?.role === 'admin' ? 'Admin' : 'Active student'}
          </span>
          <div className="profile-meta">
            <span>Student ID</span>
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
              {editing ? (
                <input
                  id="editName"
                  name="name"
                  placeholder="Full name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <strong id="profileName">{formData.name}</strong>
              )}
            </div>
            <div>
              <small>Email</small>
              {editing ? (
                <input
                  id="editEmail"
                  name="email"
                  type="email"
                  placeholder="name@tuke.sk"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <strong id="profileEmail">{formData.email}</strong>
              )}
            </div>
            <div>
              <small>Study programme</small>
              {editing ? (
                <select
                  name="programme"
                  required
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              ) : (
                <strong>{formData.programme || '-'}</strong>
              )}
            </div>
            <div>
              <small>Study level</small>
              <strong>{user?.role === 'admin' ? 'Administrator' : "Master's degree"}</strong>
            </div>
            <div>
              <small>Academic year</small>
              {editing ? (
                <select
                  name="academicYear"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                >
                  <option value="2026/27">2026/27</option>
                  <option value="2025/26">2025/26</option>
                </select>
              ) : (
                <strong>{formData.academicYear || '-'}</strong>
              )}
            </div>
            <div>
              <small>Study status</small>
              {editing ? (
                <select
                  name="studyStatus"
                  required
                  value={formData.studyStatus}
                  onChange={(e) => setFormData({ ...formData, studyStatus: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              ) : (
                <strong>{formData.studyStatus || '-'}</strong>
              )}
            </div>
          </div>

          {editing && (
            <form className="inline-edit" onSubmit={handleSave}>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" className="text-btn" onClick={() => setEditing(false)} style={{ marginLeft: '0.5rem' }}>
                Cancel
              </button>
            </form>
          )}
        </article>
      </div>
    </section>
  );
};

export default Profile;
