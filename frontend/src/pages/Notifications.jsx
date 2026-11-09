import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { Bell, Check } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        showToast('Failed to load notifications', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) =>
        n.id === id ? { ...n, is_read: 1 } : n
      ));
    } catch (err) {
      showToast('Failed to mark as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/mark-all-read');
      setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  if (loading) {
    return (
      <section className="page active" id="page-notifications">
        <div className="page-intro">
          <div>
            <p className="eyebrow">STAY INFORMED</p>
            <h2>Notifications</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </section>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <section className="page active" id="page-notifications">
      <div className="page-intro">
        <div>
          <p className="eyebrow">STAY INFORMED</p>
          <h2>Notifications</h2>
          <p className="muted">Your latest academic reminders and updates.</p>
        </div>
        {unreadCount > 0 && (
          <button className="secondary-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div id="notificationList" className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
            <h3>No notifications</h3>
            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => !n.is_read && markAsRead(n.id)}
            >
              <div className="title">{n.title}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{n.message}</div>
              <div className="time">
                {new Date(n.created_at).toLocaleDateString()} ·
                {!n.is_read ? <Check size={14} style={{ color: '#2563eb' }} /> : 'Read'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Notifications;
