import { useState, useEffect } from 'react';
import { reportsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#e8990a','#22c55e','#3b82f6','#9333ea','#f59e0b','#06b6d4'];

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const isFinancial = hasRole('FINANCIAL_ANALYST', 'FLEET_MANAGER');

  const [tab, setTab] = useState('fuel');
  const [data, setData] = useState({ fuel: [], utilization: [], cost: [], roi: [] });
  const [loading, setLoading] = useState(false);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const endpoints = {
        fuel: reportsApi.fuelEfficiency,
        utilization: reportsApi.fleetUtilization,
        cost: reportsApi.operationalCost,
        roi: reportsApi.vehicleRoi,
      };
      const res = await endpoints[type]();
      setData((prev) => ({ ...prev, [type]: res.data ?? [] }));
    } catch {
      toast.error('Failed to load report');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isFinancial) fetchReport(tab); }, [tab]);

  const exportCsv = async (type) => {
    try {
      const res = await reportsApi.exportCsv(type);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
  };

  const TABS = [
    { key: 'fuel',        label: 'Fuel Efficiency',    icon: '⛽' },
    { key: 'utilization', label: 'Fleet Utilization',  icon: '📊' },
    { key: 'cost',        label: 'Operational Cost',   icon: '💰' },
    { key: 'roi',         label: 'Vehicle ROI',        icon: '📈' },
  ];

  const currentData = data[tab] || [];

  const renderChart = () => {
    if (loading) return <Spinner />;
    if (!currentData.length)
      return <EmptyState icon="📊" title="No data yet" sub="Run some trips and log fuel/maintenance to see reports" />;

    if (tab === 'fuel') {
      const chartD = currentData.map((d, i) => ({
        name: d.registrationNumber ?? `V${i+1}`,
        efficiency: Number(Number(d.efficiency ?? 0).toFixed(2)),
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartD}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: 'km/L', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="efficiency" radius={[4,4,0,0]}>
              {chartD.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (tab === 'cost') {
      const chartD = currentData.map((d, i) => ({
        name: d.registrationNumber ?? `V${i+1}`,
        maintenance: Number(d.maintenanceCost ?? 0),
        fuel: Number(d.fuelCost ?? 0),
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartD}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => `₹${Number(v).toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9a9a9a' }} />
            <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="fuel"        name="Fuel"        fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (tab === 'roi') {
      const chartD = currentData.map((d, i) => ({
        name: d.registrationNumber ?? `V${i+1}`,
        roi: Number(Number(d.roi ?? 0).toFixed(4)),
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartD}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="roi" name="ROI" radius={[4,4,0,0]}>
              {chartD.map((d, i) => <Cell key={i} fill={Number(d.roi) >= 0 ? '#22c55e' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // utilization — table
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Utilization %</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((d, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{d.registrationNumber ?? `V${i+1}`}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, d.utilizationPercent ?? 0)}%`,
                        height: '100%', background: 'var(--accent)', borderRadius: 99
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>
                      {Number(d.utilizationPercent ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{JSON.stringify(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isFinancial) {
    return (
      <>
        <div className="topbar"><div className="topbar-title">Reports & Analytics</div></div>
        <div className="page-body">
          <EmptyState icon="🔒" title="Access restricted" sub="Reports are available to FINANCIAL_ANALYST and FLEET_MANAGER roles only." />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Reports & Analytics</div>
          <div className="topbar-subtitle">Fleet performance & financial insights</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => fetchReport(tab)}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => exportCsv(tab)}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Tab selector */}
        <div className="tabs">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{TABS.find((t) => t.key === tab)?.label}</span>
          </div>
          {renderChart()}
        </div>

        {/* Data table below chart */}
        {!loading && currentData.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Raw Data</span>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    {Object.keys(currentData[0]).map((k) => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ fontSize: 12 }}>
                          {typeof v === 'number' ? v.toLocaleString() : String(v ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
