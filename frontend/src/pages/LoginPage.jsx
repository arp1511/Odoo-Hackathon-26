import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';

const ROLE_HINTS = [
  { role: 'FLEET_MANAGER',     note: 'Full access' },
  { role: 'DISPATCHER',        note: 'Trips & vehicles' },
  { role: 'SAFETY_OFFICER',    note: 'Drivers & safety' },
  { role: 'FINANCIAL_ANALYST', note: 'Reports & costs' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', role: 'FLEET_MANAGER',
  });

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    if (!loginForm.email || !loginForm.password) { setErr('Email and password are required.'); return; }
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (ex) {
      const msg = ex?.response?.data || ex?.response?.data?.message || 'Invalid credentials.';
      setErr(typeof msg === 'string' ? msg : 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    const { name, email, password, role } = regForm;
    if (!name || !email || !password || !role) { setErr('All fields are required.'); return; }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await authApi.register({ name, email, password, role });
      toast.success('Account created! Please sign in.');
      setMode('login');
      setLoginForm({ email, password: '' });
    } catch (ex) {
      const msg = ex?.response?.data || ex?.response?.data?.message || 'Registration failed.';
      setErr(typeof msg === 'string' ? msg : 'Registration failed.');
    } finally { setLoading(false); }
  };

  const lf = (k) => (e) => setLoginForm({ ...loginForm, [k]: e.target.value });
  const rf = (k) => (e) => setRegForm({ ...regForm, [k]: e.target.value });

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🚛</div>
          <div className="login-logo-title">TransitOps</div>
          <div className="login-logo-sub">Fleet Management Platform</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-input)', borderRadius: 8, padding: 3 }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(''); }}
              style={{
                flex: 1, padding: '7px', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text-muted)',
                transition: 'all .15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="you@company.com"
                value={loginForm.email} onChange={lf('email')} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={loginForm.password} onChange={lf('password')} autoComplete="current-password" />
            </div>
            {err && <div className="alert alert-danger" style={{ fontSize: 12 }}>⚠ {err}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '10px', fontSize: 14 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" type="text" placeholder="Rahul Sharma"
                value={regForm.name} onChange={rf('name')} autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-control" type="email" placeholder="you@company.com"
                value={regForm.email} onChange={rf('email')} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password * (min 6 chars)</label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={regForm.password} onChange={rf('password')} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control" value={regForm.role} onChange={rf('role')}>
                {ROLE_HINTS.map(({ role, note }) => (
                  <option key={role} value={role}>{role.replace(/_/g, ' ')} — {note}</option>
                ))}
              </select>
            </div>
            {err && <div className="alert alert-danger" style={{ fontSize: 12 }}>⚠ {err}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '10px', fontSize: 14 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Roles reference */}
        <div style={{ marginTop: 20 }}>
          <div className="login-divider">Roles Reference</div>
          <div className="roles-demo" style={{ marginTop: 10 }}>
            <div className="roles-demo-title">Available roles in the system:</div>
            <ul>
              {ROLE_HINTS.map(({ role, note }) => (
                <li key={role}>
                  <span>{role.replace(/_/g, ' ')}</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
