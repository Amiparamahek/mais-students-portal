import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { showToast } from '../components/Toast';
import {
  BookOpen, CheckCheck, GraduationCap, Bell, Clock, Plus, ArrowRight
} from 'lucide-react';

const ICONS = {
  courses: BookOpen,
  attendance: CheckCheck,
  grades: GraduationCap,
  notifications: Bell,
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    courses: 0,
    attendance: '0%',
    grades: 0,
    notifications: 0,
  });
  const [schedule, setSchedule] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, gradesRes, attendanceRes, notifRes, annRes, timetableRes] = await Promise.all([
          API.get('/courses/my-enrollments'),
          API.get('/grades/my-grades'),
          API.get('/attendance/my-attendance'),
          API.get('/notifications/unread-count'),
          API.get('/announcements'),
          API.get('/timetable'),
        ]);

        setStats({
          courses: coursesRes.data.length,
          attendance: attendanceRes.data.length > 0
            ? attendanceRes.data[0].percentage || '0%'
            : '0%',
          grades: gradesRes.data.length,
          notifications: notifRes.data.count,
        });

        setSchedule(timetableRes.data.slice(0, 2));

        if (annRes.data.length > 0) {
          setAnnouncement(annRes.data[0]);
        }
      } catch (err) {
        console.error('Dashboard load error', err);
      }
    };

    fetchData();
  }, []);

  const goTo = (path) => navigate(path);

  return (
    <section className="page active" id="page-dashboard">
      <div className="welcome-banner">
        <div>
          <p className="eyebrow light">MONDAY, YOUR STUDY SPACE</p>
          <h2>Good afternoon <span>✦</span></h2>
          <p>Here’s what is happening with your studies today.</p>
        </div>
        <div className="banner-shape">M</div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-icon lavender">
            <BookOpen size={24} />
          </div>
          <p>Enrolled courses</p>
          <h3>{stats.courses}</h3>
          <small className="positive">This semester</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon mint">
            <CheckCheck size={24} />
          </div>
          <p>Attendance</p>
          <h3>{stats.attendance}</h3>
          <small className="positive">Good standing</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon peach">
            <GraduationCap size={24} />
          </div>
          <p>Published grades</p>
          <h3>{stats.grades}</h3>
          <small>Latest results available</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon blue">
            <Bell size={24} />
          </div>
          <p>New notifications</p>
          <h3>{stats.notifications}</h3>
          <small>Check your updates</small>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel large-panel">
          <div className="panel-heading">
            <div>
              <h3>Upcoming schedule</h3>
              <p className="muted">Your next classes and exams</p>
            </div>
            <button className="text-btn" onClick={() => goTo('/timetable')}>
              View timetable →
            </button>
          </div>
          <div id="dashboardSchedule" className="schedule-list">
            {schedule.length === 0 ? (
              <p className="muted">No upcoming classes scheduled.</p>
            ) : (
              schedule.map((item) => (
                <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <strong>{item.course_code || item.code}</strong> - {item.day} {item.time}
                  <br />
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    {item.room || 'TBA'} · {item.course_name || item.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Quick actions</h3>
              <p className="muted">Common student tasks</p>
            </div>
          </div>
          <div className="quick-actions">
            <button onClick={() => goTo('/courses')}>
              <Plus size={20} />
              <div>
                <strong>Register for a course</strong>
                <small>Browse available subjects</small>
              </div>
              <ArrowRight size={18} />
            </button>
            <button onClick={() => goTo('/grades')}>
              <GraduationCap size={20} />
              <div>
                <strong>Check grades</strong>
                <small>Review published results</small>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>
        </article>
      </div>

      <article className="panel announcement-preview">
        <div className="panel-heading">
          <div>
            <h3>Latest announcement</h3>
            <p className="muted">Updates from your university</p>
          </div>
          <button className="text-btn" onClick={() => goTo('/announcements')}>
            All announcements →
          </button>
        </div>
        <div id="latestAnnouncement">
          {announcement ? (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{announcement.title}</h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{announcement.content}</p>
              <small style={{ color: '#94a3b8' }}>{new Date(announcement.created_at).toLocaleDateString()}</small>
            </div>
          ) : (
            <p className="muted">No announcements at the moment.</p>
          )}
        </div>
      </article>
    </section>
  );
};

export default Dashboard;
