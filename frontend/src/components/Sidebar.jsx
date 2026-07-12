import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Truck, Users, Navigation,
  Wrench, Fuel, BarChart2, Settings, LogOut
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles',  icon: Truck,           label: 'Vehicles' },
  { to: '/drivers',   icon: Users,           label: 'Drivers & Safety' },
  { to: '/trips',     icon: Navigation,      label: 'Trip Dispatch' },
  { to: '/maintenance', icon: Wrench,        label: 'Maintenance' },
  { to: '/fuel',      icon: Fuel,            label: 'Fuel & Expenses' },
  { to: '/reports',   icon: BarChart2,       label: 'Reports' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
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
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚛</div>
        <div>
          <div className="sidebar-logo-text">TransitOps</div>
          <div className="sidebar-logo-sub">Fleet Management</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role?.replace(/_/g, ' ')}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
