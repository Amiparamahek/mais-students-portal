import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { CheckCheck } from 'lucide-react';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/attendance/my-attendance');
        setRecords(res.data);
      } catch (err) {
        showToast('Failed to load attendance', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="page active" id="page-attendance">
        <div className="page-intro">
          <div>
            <p className="eyebrow">CLASS PARTICIPATION</p>
            <h2>Attendance</h2>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading attendance...</p>
      </section>
    );
  }

  return (
    <section className="page active" id="page-attendance">
      <div className="page-intro">
        <div>
          <p className="eyebrow">CLASS PARTICIPATION</p>
          <h2>Attendance</h2>
          <p className="muted">Review attendance records for your courses.</p>
        </div>
        <span className="status-pill green">Overall: 92%</span>
      </div>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Classes held</th>
              <th>Attended</th>
              <th>Attendance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="attendanceTable">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const pct = r.percentage || 0;
                const status = pct >= 75 ? 'Good' : 'Low';
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.course_name || r.name}</strong> ({r.course_code || r.code})
                    </td>
                    <td>{r.classes_held}</td>
                    <td>{r.classes_attended}</td>
                    <td>{pct}%</td>
                    <td>
                      <span className={`status-badge ${pct >= 75 ? 'enrolled' : 'dropped'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="footnote muted">
        Attendance records are read-only for students. Authorized staff can update them through administration.
      </p>
    </section>
  );
};

export default Attendance;
