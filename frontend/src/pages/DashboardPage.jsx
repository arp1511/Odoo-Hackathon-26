import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/services';
import { Spinner } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Truck, Users, Navigation, AlertTriangle } from 'lucide-react';

const KPI_DEFS = [
  { key: 'activeVehicles',       label: 'Active Vehicles',       icon: '🚛', color: '#e8990a' },
  { key: 'availableVehicles',    label: 'Available Vehicles',    icon: '✅', color: '#22c55e' },
  { key: 'vehiclesInMaintenance',label: 'In Maintenance',        icon: '🔧', color: '#f59e0b' },
  { key: 'activeTrips',          label: 'Active Trips',          icon: '🛣️', color: '#3b82f6' },
  { key: 'pendingTrips',         label: 'Pending Trips',         icon: '📋', color: '#9333ea' },
  { key: 'driversOnDuty',        label: 'Drivers On Duty',       icon: '👤', color: '#06b6d4' },
  { key: 'fleetUtilizationPercent', label: 'Fleet Utilization',  icon: '📊', color: '#e8990a', pct: true },
];

const KpiCard = ({ item, kpis }) => {
  const [transform, setTransform] = useState('');
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate 3D tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setSpotlight({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSpotlight({ ...spotlight, opacity: 0 });
  };

  return (
    <div 
      className="kpi-card interactive-card" 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: transform.includes('rotateX(0deg)') ? 'transform 0.5s ease' : 'transform 0.1s ease' }}
    >
      {/* Spotlight Glow */}
      <div 
        className="spotlight" 
        style={{
          background: `radial-gradient(600px circle at ${spotlight.x}px ${spotlight.y}px, rgba(0, 240, 255, 0.15), transparent 40%)`,
          opacity: spotlight.opacity,
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none', transition: 'opacity 0.3s ease', zIndex: 0
        }} 
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="kpi-label">{item.label}</div>
        <div className="kpi-value" style={{ color: item.color }}>
          {kpis?.[item.key] !== undefined
            ? item.pct
              ? `${Number(kpis[item.key]).toFixed(1)}%`
              : kpis[item.key]
            : '—'}
        </div>
        <div className="kpi-sub" style={{ fontSize: 18 }}>{item.icon}</div>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.kpis()
      .then((r) => setKpis(r.data))
      .catch(() => setKpis({}))
      .finally(() => setLoading(false));
  }, []);

  const chartData = kpis
    ? [
        { name: 'Available',     value: kpis.availableVehicles    || 0, fill: '#22c55e' },
        { name: 'On Trip',       value: kpis.activeVehicles       || 0, fill: '#3b82f6' },
        { name: 'In Maint.',     value: kpis.vehiclesInMaintenance || 0, fill: '#f59e0b' },
        { name: 'Drivers Duty',  value: kpis.driversOnDuty        || 0, fill: '#e8990a' },
        { name: 'Active Trips',  value: kpis.activeTrips          || 0, fill: '#9333ea' },
      ]
    : [];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-subtitle">Fleet overview & key metrics</div>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid" style={{ marginBottom: 24, perspective: '1000px' }}>
              {KPI_DEFS.map((item) => (
                <KpiCard key={item.key} item={item} kpis={kpis} />
              ))}
            </div>

            {/* Chart + status split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Fleet Status Overview</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={36}>
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 12, color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      cursor={{ fill: 'var(--bg-grid)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Fleet Utilization</span>
                </div>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: '50%',
                    border: '8px solid var(--bg-input)',
                    borderTopColor: 'var(--accent)',
                    borderRightColor: kpis?.fleetUtilizationPercent > 25 ? 'var(--accent)' : 'var(--bg-input)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                      {kpis?.fleetUtilizationPercent != null
                        ? `${Number(kpis.fleetUtilizationPercent).toFixed(0)}%`
                        : '—'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
                    Fleet Utilization Rate
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, padding: '0 1.5rem 1rem' }}>
                  {[
                    { label: 'Active Vehicles',  val: kpis?.activeVehicles, color: '#3b82f6' },
                    { label: 'Available Now',    val: kpis?.availableVehicles, color: '#22c55e' },
                    { label: 'In Maintenance',   val: kpis?.vehiclesInMaintenance, color: '#f59e0b' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{val ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
