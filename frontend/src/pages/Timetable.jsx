import { useState, useEffect } from 'react';
import API from '../services/api';
import { showToast } from '../components/Toast';
import { Calendar, Clock } from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedDay, setSelectedDay] = useState('TUE');
  const [showExams, setShowExams] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, eRes] = await Promise.all([
          API.get('/timetable'),
          API.get('/exams'),
        ]);
        setTimetable(tRes.data);
        setExams(eRes.data);
      } catch (err) {
        showToast('Failed to load timetable', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dayClasses = timetable.filter((t) => t.day === selectedDay);

  return (
    <section className="page active" id="page-timetable">
      <div className="page-intro">
        <div>
          <p className="eyebrow">PLAN YOUR WEEK</p>
          <h2>Timetable & exams</h2>
          <p className="muted">See your classes, rooms and examination dates.</p>
        </div>
        <button className="secondary-btn" onClick={() => setShowExams(!showExams)}>
          {showExams ? 'Hide exams' : 'Show exams'}
        </button>
      </div>

      <div className="week-strip">
        {DAYS.map((day) => (
          <div
            key={day}
            onClick={() => setSelectedDay(day)}
            className={selectedDay === day ? 'selected' : ''}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: selectedDay === day ? '#dbeafe' : 'transparent',
              border: selectedDay === day ? '2px solid #2563eb' : '1px solid #e2e8f0',
              cursor: 'pointer',
              fontWeight: selectedDay === day ? '700' : '500',
              color: selectedDay === day ? '#1e40af' : '#64748b',
              transition: 'all 0.2s',
            }}
          >
            <small>{day}</small>
            <br />
            <strong>{day === 'MON' ? '26' : day === 'TUE' ? '27' : day === 'WED' ? '28' : day === 'THU' ? '29' : '30'}</strong>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3 id="scheduleTitle">{selectedDay}'s schedule</h3>
            <p className="muted">Winter semester · Week 5</p>
          </div>
          <span className="status-pill lavender-pill">
            {dayClasses.length} classes today
          </span>
        </div>
        <div id="fullSchedule" className="schedule-list">
          {dayClasses.length === 0 ? (
            <p className="muted">No classes scheduled for {selectedDay}.</p>
          ) : (
            dayClasses.map((item) => (
              <div key={item.id} style={{ padding: '1rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{item.course_name || item.name}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    {item.code} · {item.lecturer || 'TBA'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600' }}>{item.time}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.room || 'TBA'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showExams && (
        <div className="panel mt-20">
          <div className="panel-heading">
            <div>
              <h3>Upcoming examinations</h3>
              <p className="muted">Keep track of important dates</p>
            </div>
          </div>
          <div id="examList" className="exam-list">
            {exams.length === 0 ? (
              <p className="muted">No upcoming exams.</p>
            ) : (
              exams.map((e) => (
                <div key={e.id} style={{ padding: '1rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{e.exam_name}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                      {e.course_name || e.name} ({e.code})
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{new Date(e.exam_date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.exam_time || 'TBA'} · {e.room || 'TBA'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Timetable;
