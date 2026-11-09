import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { GraduationCap } from 'lucide-react';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/grades/my-grades');
        setGrades(res.data);
      } catch (err) {
        showToast('Failed to load grades', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalCredits = 30;
  const completedCredits = grades.reduce((sum, g) => sum + (parseInt(g.credits) || 0), 0);

  if (loading) {
    return (
      <section className="page active" id="page-grades">
        <div className="page-intro">
          <div>
            <p className="eyebrow">ACADEMIC PERFORMANCE</p>
            <h2>Grades & results</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading grades...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-grades">
      <div className="page-intro">
        <div>
          <p className="eyebrow">ACADEMIC PERFORMANCE</p>
          <h2>Grades & results</h2>
          <p className="muted">Only published grades are shown here.</p>
        </div>
        <span className="status-pill green">Good standing</span>
      </div>

      <div className="stat-grid three">
        <article className="stat-card">
          <p>Completed credits</p>
          <h3>{completedCredits} <small>/{totalCredits}</small></h3>
          <div className="progress">
            <span style={{ width: `${Math.min((completedCredits / totalCredits) * 100, 100)}%` }} />
          </div>
        </article>
        <article className="stat-card">
          <p>Published results</p>
          <h3>{grades.length}</h3>
          <small>Across current and previous courses</small>
        </article>
        <article className="stat-card">
          <p>Academic year</p>
          <h3>2026/27</h3>
          <small>Winter semester</small>
        </article>
      </div>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Assessment</th>
              <th>Date</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="gradeTable">
            {grades.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                  No grades published yet.
                </td>
              </tr>
            ) : (
              grades.map((g) => (
                <tr key={g.id}>
                  <td>
                    <strong>{g.course_name || g.name}</strong> ({g.course_code || g.code})
                  </td>
                  <td>{g.assessment}</td>
                  <td>{new Date(g.grade_date).toLocaleDateString()}</td>
                  <td>
                    <strong style={{ color: '#10b981' }}>{g.grade}</strong>
                  </td>
                  <td>
                    <span className="status-badge enrolled">Published</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Grades;
