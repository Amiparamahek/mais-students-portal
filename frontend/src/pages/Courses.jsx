import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { Plus } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, eRes] = await Promise.all([
          API.get('/courses'),
          API.get('/courses/my-enrollments'),
        ]);
        setCourses(cRes.data);
        setEnrolled(eRes.data.map((e) => e.course_id));
      } catch (err) {
        showToast('Failed to load courses', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const enrolledIds = new Set(enrolled.map((e) => typeof e === 'number' ? e : e.course_id));

  const filtered = courses.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    if (filter === 'enrolled') return matchesSearch && enrolledIds.has(c.id);
    if (filter === 'available') return matchesSearch && !enrolledIds.has(c.id);
    return matchesSearch;
  });

  const enroll = async (courseId) => {
    try {
      await API.post('/courses/enroll', { courseId });
      showToast('Enrolled successfully!', 'success');
      const eRes = await API.get('/courses/my-enrollments');
      setEnrolled(eRes.data);
      enrolledIds.add(courseId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Enrollment failed', 'error');
    }
  };

  const unenroll = async (courseId) => {
    try {
      await API.delete(`/courses/enroll/${courseId}`);
      showToast('Unenrolled successfully', 'success');
      const eRes = await API.get('/courses/my-enrollments');
      setEnrolled(eRes.data);
      enrolledIds.delete(courseId);
    } catch (err) {
      showToast('Unenroll failed', 'error');
    }
  };

  if (loading) {
    return (
      <section className="page active" id="page-courses">
        <div className="page-intro">
          <div>
            <p className="eyebrow">STUDY PLAN</p>
            <h2>Course registration</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading courses...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-courses">
      <div className="page-intro">
        <div>
          <p className="eyebrow">STUDY PLAN</p>
          <h2>Course registration</h2>
          <p className="muted">Browse subjects and manage your enrollment.</p>
        </div>
        <span className="status-pill blue">Winter semester 2026/27</span>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Plus size={18} />
          <input
            id="courseSearch"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="courseFilter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All courses</option>
          <option value="enrolled">Enrolled</option>
          <option value="available">Available</option>
        </select>
      </div>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Course code</th>
              <th>Credits</th>
              <th>Lecturer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="courseTable">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>
                  No courses found
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const isEnrolled = enrolledIds.has(course.id);
                return (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.name}</strong>
                    </td>
                    <td>{course.code}</td>
                    <td>{course.credits}</td>
                    <td>{course.lecturer}</td>
                    <td>
                      <span className={`status-badge ${isEnrolled ? 'enrolled' : 'available'}`}>
                        {isEnrolled ? 'Enrolled' : 'Available'}
                      </span>
                    </td>
                    <td>
                      {isEnrolled ? (
                        <button
                          className="text-btn"
                          onClick={() => unenroll(course.id)}
                          style={{ color: '#ef4444' }}
                        >
                          Unenroll
                        </button>
                      ) : (
                        <button
                          className="primary-btn"
                          onClick={() => enroll(course.id)}
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                        >
                          Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="muted footnote">
        Enrollment changes are saved to your account on the server.
      </p>
    </section>
  );
};

export default Courses;
