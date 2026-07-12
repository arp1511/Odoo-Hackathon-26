import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

const RBAC_MATRIX = [
  { role: 'Fleet Manager',     fleet: '✓', drivers: '✓', trips: '✓', fuelExp: '✓', analytics: '✓' },
  { role: 'Dispatcher',        fleet: 'View', drivers: '—', trips: '✓', fuelExp: '—', analytics: '—' },
  { role: 'Safety Officer',    fleet: '—', drivers: '✓', trips: 'View', fuelExp: '—', analytics: '—' },
  { role: 'Financial Analyst', fleet: 'View', drivers: '—', trips: '—', fuelExp: '✓', analytics: '✓' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    depotName: 'Gandhinagar Depot GJ4',
    currency: 'INR (Rs)',
    distanceUnit: 'Kilometers'
  });

  const saveChanges = () => {
    toast.success('Settings saved successfully (Mock)');
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Settings & RBAC</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure platform defaults and view permissions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: GENERAL SETTINGS */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>General</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Depot Name</label>
              <input 
                className="input-field" 
                value={form.depotName} 
                onChange={e => setForm({...form, depotName: e.target.value})} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Currency</label>
              <input 
                className="input-field" 
                value={form.currency} 
                onChange={e => setForm({...form, currency: e.target.value})} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Distance Unit</label>
              <input 
                className="input-field" 
                value={form.distanceUnit} 
                onChange={e => setForm({...form, distanceUnit: e.target.value})} 
              />
            </div>

            <button className="btn btn-primary" onClick={saveChanges} style={{ padding: '1rem', marginTop: '1rem' }}>
              Save changes
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RBAC MATRIX */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Role-Based Access (RBAC)</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Fleet</th>
                  <th style={{ padding: '1rem' }}>Drivers</th>
                  <th style={{ padding: '1rem' }}>Trips</th>
                  <th style={{ padding: '1rem' }}>Fuel/Exp.</th>
                  <th style={{ padding: '1rem' }}>Analytics</th>
                </tr>
              </thead>
              <tbody>
                {RBAC_MATRIX.map((row) => (
                  <tr key={row.role} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    background: user?.role.replace(/_/g, ' ').toLowerCase() === row.role.toLowerCase() ? 'rgba(0, 240, 255, 0.05)' : 'transparent'
                  }}>
                    <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {row.role} {user?.role.replace(/_/g, ' ').toLowerCase() === row.role.toLowerCase() ? '(You)' : ''}
                    </td>
                    <td style={{ padding: '1rem', color: row.fleet === '✓' ? 'var(--color-secondary)' : 'var(--text-muted)' }}>{row.fleet}</td>
                    <td style={{ padding: '1rem', color: row.drivers === '✓' ? 'var(--color-secondary)' : 'var(--text-muted)' }}>{row.drivers}</td>
                    <td style={{ padding: '1rem', color: row.trips === '✓' ? 'var(--color-secondary)' : 'var(--text-muted)' }}>{row.trips}</td>
                    <td style={{ padding: '1rem', color: row.fuelExp === '✓' ? 'var(--color-secondary)' : 'var(--text-muted)' }}>{row.fuelExp}</td>
                    <td style={{ padding: '1rem', color: row.analytics === '✓' ? 'var(--color-secondary)' : 'var(--text-muted)' }}>{row.analytics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Current Session</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>User:</span> {user?.name}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> <span style={{ color: 'var(--color-primary)' }}>{user?.role}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {user?.email}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> ACTIVE</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
