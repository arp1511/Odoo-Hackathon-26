import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Truck, Users, Navigation,
  Wrench, Fuel, BarChart2, Settings, LogOut
} from 'lucide-react';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      </div>

      {/* User footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role?.replace(/_/g, ' ')}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
