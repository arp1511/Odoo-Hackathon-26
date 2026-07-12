import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { Eye, EyeOff, Activity } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setErr('');
    if (!password || !confirmPassword) {
      setErr('Please fill out all fields.');
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }
    if (!token) {
      setErr('Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    try {
      await authApi.client.post('/auth/reset-password', { token, password });
      toast.success('Password successfully reset! You can now log in.');
      navigate('/login');
    } catch (ex) {
      const msg = ex?.response?.data || 'Failed to reset password.';
      setErr(typeof msg === 'string' ? msg : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '48px', height: '48px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Set New Password</h1>
        </div>

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>New Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="input-field" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '0.75rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirm Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="input-field" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                style={{ width: '100%', paddingRight: '2.5rem' }} />
            </div>
          </div>

          {err && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--color-danger)', padding: '0.75rem', borderRadius: '4px' }}>⚠ {err}</div>}
          
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0.875rem', marginTop: '1rem' }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
