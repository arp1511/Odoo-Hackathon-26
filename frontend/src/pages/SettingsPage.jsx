import { useAuth } from '../context/AuthContext';

const ROLES = [
  { role: 'FLEET_MANAGER',     perms: ['Vehicles CRUD', 'Drivers create/edit', 'Maintenance open/close', 'Fuel logs', 'Expenses', 'Reports', 'Dashboard'] },
  { role: 'DISPATCHER',        perms: ['Create trips', 'Dispatch trips', 'Complete/Cancel trips', 'Log fuel', 'View vehicles & drivers'] },
  { role: 'SAFETY_OFFICER',    perms: ['Create/edit drivers', 'Suspend/reinstate drivers', 'View expiring licenses', 'View vehicles'] },
  { role: 'FINANCIAL_ANALYST', perms: ['View reports', 'Export CSV', 'View expenses & fuel', 'View maintenance'] },
];

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Settings & RBAC</div>
          <div className="topbar-subtitle">Role-based access control overview</div>
        </div>
      </div>

      <div className="page-body">
        {/* Current session */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Current Session</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Name',   val: user?.name },
              { label: 'Email',  val: user?.email },
              { label: 'Role',   val: user?.role?.replace(/_/g, ' ') },
              { label: 'Status', val: user?.status ?? 'ACTIVE' },
              { label: 'User ID', val: user?.id },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: val ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: label === 'User ID' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
                  {val ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RBAC matrix */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">RBAC — Role Permissions Matrix</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {ROLES.map(({ role, perms }) => (
              <div key={role} style={{
                background: role === user?.role ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                border: `1px solid ${role === user?.role ? 'var(--border-accent)' : 'var(--border)'}`,
                borderRadius: 8, padding: 16,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10,
                  color: role === user?.role ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {role === user?.role ? '★ ' : ''}{role.replace(/_/g, ' ')}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {perms.map((p) => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)', fontSize: 10 }}>✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* API Info */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><span className="card-title">API Information</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Base URL',     val: import.meta.env.VITE_API_URL || 'http://localhost:8080' },
              { label: 'Swagger UI',   val: `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/swagger-ui.html` },
              { label: 'Auth',         val: 'JWT Bearer Token (stored in localStorage)' },
              { label: 'Token Status', val: localStorage.getItem('token') ? '✓ Token present' : '✗ Not authenticated' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
