import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    programme: 'Computer Science',
    academicYear: '2026/27',
    studyStatus: 'Full-time',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'student',
        studentId: formData.studentId || null,
        faculty: 'Faculty of Electrical Engineering and Informatics',
        programme: formData.programme,
        academicYear: formData.academicYear,
      });
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="login-logo">M</div>
        <p className="eyebrow">TECHNICAL UNIVERSITY OF KOŠICE</p>
        <h1>Join MAIS<br /><em>Student Portal.</em></h1>
        <p>Create your student account to access courses, schedule, grades and updates.</p>
        <div className="login-decor">MAIS <span>•</span> LEARN <span>•</span> GROW</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h2>Register as Student</h2>
        <p className="muted">Fill in your university details below.</p>

        <label>Full name</label>
        <input
          id="regName"
          name="name"
          placeholder="e.g. Raj Patel"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <label>University email</label>
        <input
          id="regEmail"
          name="email"
          type="email"
          placeholder="raj.patel@tuke.sk"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <label>Student ID</label>
        <input
          id="regStudentId"
          name="studentId"
          placeholder="e.g. MAIS-2026-0143"
          required
          value={formData.studentId}
          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
        />

        <label>Password</label>
        <input
          id="regPassword"
          name="password"
          type="password"
          placeholder="Create a password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <label>Study programme</label>
        <select
          required
          value={formData.programme}
          onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
        >
          <option value="Computer Science">Computer Science</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
        </select>

        <label>Academic year</label>
        <select
          required
          value={formData.academicYear}
          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
        >
          <option value="2026/27">2026/27</option>
          <option value="2025/26">2025/26</option>
        </select>

        <label>Study status</label>
        <select
          required
          value={formData.studyStatus}
          onChange={(e) => setFormData({ ...formData, studyStatus: e.target.value })}
        >
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>

        <button className="primary-btn full" type={loading ? 'button' : 'submit'} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>

        <p className="demo-note">Already have an account?{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </p>
        <p id="registerMessage" className="form-message" role="status"></p>
      </form>
    </div>
  );
};

export default Register;
