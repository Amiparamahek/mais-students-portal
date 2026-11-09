import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { Mail, Lock } from 'lucide-react';

const Password = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showToast('Password updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Password change failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    showToast('Reset link would be sent to your email (demo)', 'info');
  };

  return (
    <section className="page active" id="page-password">
      <div className="page-intro">
        <div>
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h2>Password management</h2>
          <p className="muted">Change your password or request a reset.</p>
        </div>
      </div>

      <div className="settings-layout">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Change password</h3>
              <p className="muted">Use a strong password you do not use elsewhere.</p>
            </div>
            <div className="stat-icon lavender">
              <Lock size={24} />
            </div>
          </div>
          <form id="passwordForm" className="stack-form" onSubmit={handleChangePassword}>
            <label>
              Current password
              <input
                type="password"
                id="currentPassword"
                required
                minLength="1"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label>
              New password
              <input
                type="password"
                id="newPassword"
                required
                minLength="8"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                id="confirmPassword"
                required
                minLength="8"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
            <p id="passwordMessage" className="form-message"></p>
          </form>
        </article>

        <article className="panel help-panel">
          <div className="stat-icon blue">
            <Mail size={24} />
          </div>
          <h3>Forgot your password?</h3>
          <p className="muted">
            In a real university system, a reset link would be sent to your registered email address.
          </p>
          <button className="secondary-btn" onClick={handleReset}>
            Request reset link
          </button>
          <p id="resetMessage" className="form-message"></p>
        </article>
      </div>
    </section>
  );
};

export default Password;
