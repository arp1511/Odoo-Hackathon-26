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
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
              {KPI_DEFS.map(({ key, label, icon, color, pct }) => (
                <div className="kpi-card" key={key}>
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value" style={{ color }}>
                    {kpis?.[key] !== undefined
                      ? pct
                        ? `${Number(kpis[key]).toFixed(1)}%`
                        : kpis[key]
                      : '—'}
                  </div>
                  <div className="kpi-sub" style={{ fontSize: 18 }}>{icon}</div>
                </div>
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
                      contentStyle={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: 'rgba(255,255,255,.04)' }}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {[
                    { label: 'Active Vehicles',  val: kpis?.activeVehicles, color: '#3b82f6' },
                    { label: 'Available Now',    val: kpis?.availableVehicles, color: '#22c55e' },
                    { label: 'In Maintenance',   val: kpis?.vehiclesInMaintenance, color: '#f59e0b' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{val ?? '—'}</span>
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
