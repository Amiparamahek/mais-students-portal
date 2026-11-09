import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

// Same menu items, order and glyphs as the HTML prototype (index.html).
export const pages = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'profile', label: 'My profile', icon: '♙' },
  { key: 'courses', label: 'Course registration', icon: '▤' },
  { key: 'timetable', label: 'Timetable & exams', icon: '▦' },
  { key: 'grades', label: 'Grades', icon: '▥' },
  { key: 'attendance', label: 'Attendance', icon: '✓' },
  { key: 'announcements', label: 'Announcements', icon: '◉' },
  { key: 'notifications', label: 'Notifications', icon: '♧' },
  { key: 'admin', label: 'Administration', icon: '⚙', admin: true },
  { key: 'search', label: 'Search', icon: '⌕' },
  { key: 'password', label: 'Password settings', icon: '♢' },
];

export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2) || 'MA';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = pathname.split('/')[1] || 'dashboard';

  // Re-read the badge on every navigation so "mark as read" is reflected.
  useEffect(() => {
    if (!user) return;
    API.get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data.count || 0))
      .catch(() => setUnreadCount(0));
  }, [user, pathname]);

  if (!user) return null;

  return (
    <>
      {/* Mobile hamburger + overlay */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MAIS Portal</strong>
            <small>Student workspace</small>
          </div>
        </div>

        <div className="user-mini">
          <div className="avatar">{initialsOf(user.name)}</div>
          <div>
            <strong id="sidebarUser">{user.name}</strong>
            <small id="sidebarRole">{user.role === 'admin' ? 'Administrator' : 'Student'}</small>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          {pages
            .filter((page) => !page.admin || user.role === 'admin')
            .map((page) => (
              <button
                key={page.key}
                className={`nav-link ${current === page.key ? 'active' : ''}`}
                data-page={page.key}
                onClick={() => {
                  navigate(`/${page.key}`);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{page.icon}</span> {page.label}
                {page.key === 'notifications' && unreadCount > 0 && <i>{unreadCount}</i>}
              </button>
            ))}
        </nav>

        <button className="logout-btn" onClick={logout}>
          ↪ <span>Log out</span>
        </button>
      </aside>
    </>
  );
};

export default Navbar;