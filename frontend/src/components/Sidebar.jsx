import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';
import { Modal } from './ui';
import {
  LayoutDashboard, Truck, Users, Navigation,
  Wrench, Fuel, BarChart2, Settings, LogOut, Moon, Sun, Edit3, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',   roles: ['FLEET_MANAGER', 'DISPATCHER'] },
  { to: '/vehicles',  icon: Truck,           label: 'Fleet',       roles: ['FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'] },
  { to: '/drivers',   icon: Users,           label: 'Drivers',     roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/trips',     icon: Navigation,      label: 'Trips',       roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/maintenance', icon: Wrench,        label: 'Maintenance', roles: ['FLEET_MANAGER'] },
  { to: '/fuel',      icon: Fuel,            label: 'Fuel & Expenses',roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { to: '/reports',   icon: BarChart2,       label: 'Analytics',   roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { to: '/settings',  icon: Settings,        label: 'Settings',    roles: ['FLEET_MANAGER'] },
];

export default function Sidebar() {
  const { user, logout, theme, toggleTheme, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const handleUpdateProfile = async () => {
    if (!nameInput.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name: nameInput });
      updateUser(res.data);
      toast.success('Profile updated successfully');
      setShowEditProfile(false);
      setShowProfileMenu(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: '250px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '1.5rem' }}>🚛</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>TransitOps</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fleet Management</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem', flex: 1, overflowY: 'auto' }}>
        {NAV.filter(item => item.roles.includes(user?.role)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500, fontSize: '0.9rem',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'all var(--transition-speed) ease'
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button 
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '4px',
              border: 'none', background: 'transparent',
              fontWeight: 500, fontSize: '0.9rem', width: '100%', cursor: 'pointer',
              color: 'var(--text-muted)', textAlign: 'left',
              transition: 'all var(--transition-speed) ease'
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* User footer */}
      <div 
        style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', position: 'relative', cursor: 'pointer' }}
        onMouseEnter={() => setShowProfileMenu(true)}
        onMouseLeave={() => setShowProfileMenu(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role?.replace(/_/g, ' ')}</div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }} title="Menu">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Hover Menu Popup */}
        <div style={{
          position: 'absolute', bottom: '100%', left: '1rem', right: '1rem', marginBottom: '0.5rem',
          background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--glass-shadow)', backdropFilter: 'var(--glass-backdrop)',
          opacity: showProfileMenu ? 1 : 0, visibility: showProfileMenu ? 'visible' : 'hidden',
          transform: showProfileMenu ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all var(--transition-speed) ease', overflow: 'hidden', zIndex: 50
        }}>
          <button onClick={() => { setShowEditProfile(true); setNameInput(user?.name); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-main)', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem' }}>
            <Edit3 size={16} /> Edit Profile
          </button>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--color-danger)', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <Modal
          title="Edit Profile"
          onClose={() => setShowEditProfile(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowEditProfile(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="input-field" 
              value={nameInput} 
              onChange={e => setNameInput(e.target.value)} 
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="input-field" value={user?.role?.replace(/_/g, ' ') || ''} disabled style={{ opacity: 0.6 }} />
          </div>
        </Modal>
      )}
    </div>
  );
}
