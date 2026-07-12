import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';
import { Activity, Eye, EyeOff } from 'lucide-react';

const ROLE_HINTS = [
  { role: 'FLEET_MANAGER',     note: 'Full access to all modules' },
  { role: 'DISPATCHER',        note: 'Dashboard and Trip dispatching' },
  { role: 'SAFETY_OFFICER',    note: 'Drivers compliance and safety' },
  { role: 'FINANCIAL_ANALYST', note: 'Fuel, Expenses & Analytics' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '', role: '' });
  
  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  // Register form
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', role: '',
  });

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    if (!loginForm.email || !loginForm.password || !loginForm.role) { setErr('Email, password, and role are required.'); return; }
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

  /* ── Forgot Password ── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (!forgotEmail) { setErr('Email is required.'); return; }
    setLoading(true);
    try {
      await authApi.client.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('If an account exists, a reset link was sent.');
      setMode('login');
    } catch (ex) {
      setErr('Failed to send reset link.');
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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      
      {/* Split Container */}
      <div className="glass-panel" style={{ display: 'flex', width: '100%', maxWidth: '900px', minHeight: '550px', overflow: 'hidden' }}>
        
        {/* Left Panel - Roles Reference */}
        <div style={{ flex: 1, padding: '3rem', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 0 15px rgba(0,240,255,0.2)' }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.025em', marginBottom: '0.5rem', color: 'var(--text-main)' }}>TransitOps</h1>
          <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Smart Transport Operations Platform</p>
        </div>

        {/* Right Panel - Form */}
        <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Enter your credentials to continue</p>

          {/* Mode tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '4px', marginBottom: '2rem' }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '4px',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  background: mode === m ? 'var(--color-primary)' : 'transparent',
                  color: mode === m ? '#000' : 'var(--text-muted)',
                  transition: 'all var(--transition-speed) ease',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input className="input-field" type="email" placeholder="you@company.com"
                  value={loginForm.email} onChange={lf('email')} autoComplete="email" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input className="input-field" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={loginForm.password} onChange={lf('password')} autoComplete="current-password" 
                    style={{ width: '100%', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '0.75rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
                <select className="input-field" value={loginForm.role} onChange={lf('role')} style={{ cursor: 'pointer' }}>
                  <option value="" disabled style={{ background: 'var(--bg-dark)' }}>Select a role...</option>
                  {ROLE_HINTS.map(({ role }) => (
                    <option key={role} value={role} style={{ background: 'var(--bg-dark)' }}>{role.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                  Remember me
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot'); setErr(''); }} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
              </div>

              {err && (
                <div style={{ 
                  color: 'var(--color-danger)', fontSize: '0.85rem', 
                  background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--color-danger)', 
                  padding: '0.75rem', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' 
                }}>
                  <span style={{ fontWeight: 700 }}>X</span> 
                  <span>{err}</span>
                </div>
              )}
              
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '0.5rem' }}>Access is scoped by role after login:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>• Fleet Manager → Fleet, Maintenance</li>
                  <li>• Dispatcher → Dashboard, Trips</li>
                  <li>• Safety Officer → Drivers, Compliance</li>
                  <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
                </ul>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <input className="input-field" type="text" placeholder="Rahul Sharma"
                  value={regForm.name} onChange={rf('name')} autoComplete="name" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input className="input-field" type="email" placeholder="you@company.com"
                  value={regForm.email} onChange={rf('email')} autoComplete="email" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input className="input-field" type={showPassword ? "text" : "password"} placeholder="•••••••• (min 6 chars)"
                    value={regForm.password} onChange={rf('password')} autoComplete="new-password" 
                    style={{ width: '100%', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '0.75rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role (RBAC)</label>
                <select className="input-field" value={regForm.role} onChange={rf('role')} style={{ cursor: 'pointer' }}>
                  <option value="" disabled style={{ background: 'var(--bg-dark)' }}>Select a role...</option>
                  {ROLE_HINTS.map(({ role, note }) => (
                    <option key={role} value={role} style={{ background: 'var(--bg-dark)' }}>{role.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              {err && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--color-danger)', padding: '0.75rem', borderRadius: '4px' }}>⚠ {err}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* ── FORGOT PASSWORD FORM ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your email address and we will send you a link to reset your password.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input className="input-field" type="email" placeholder="you@company.com"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} autoComplete="email" />
              </div>
              {err && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--color-danger)', padding: '0.75rem', borderRadius: '4px' }}>⚠ {err}</div>}
              
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
                {loading ? 'Sending link…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
