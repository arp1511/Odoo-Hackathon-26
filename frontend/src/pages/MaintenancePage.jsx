import { useState, useEffect, useCallback } from 'react';
import { maintenanceApi, vehiclesApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, StatusBadge, Modal } from '../components/ui';
import { Plus, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EMPTY_FORM = { vehicleId: '', description: '', cost: '' };

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const isManager = hasRole('FLEET_MANAGER');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    maintenanceApi.list(statusFilter ? { status: statusFilter } : {})
      .then((r) => setLogs(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Failed to load maintenance logs'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    try {
      const r = await vehiclesApi.list();
      setVehicles(r.data?.content ?? r.data ?? []);
    } catch { }
    setShowCreate(true);
  };

  const create = async () => {
    if (!form.vehicleId || !form.description) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await maintenanceApi.create(form);
      toast.success('Maintenance log created — vehicle set to IN_SHOP');
      setShowCreate(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  const close = async (log) => {
    try {
      await maintenanceApi.close(log.id);
      toast.success('Maintenance closed — vehicle restored to AVAILABLE');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to close');
    }
  };

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q || l.description?.toLowerCase().includes(q) || l.vehicleRegistrationNumber?.toLowerCase().includes(q);
  });

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const totalCost = filtered.reduce((s, l) => s + Number(l.cost || 0), 0);
  const openCount = filtered.filter((l) => l.status === 'OPEN').length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Maintenance</div>
          <div className="topbar-subtitle">Vehicle maintenance tracking</div>
        </div>
        <div className="topbar-actions">
          {isManager && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Log Maintenance
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="kpi-card" style={{ flex: 1 }}>
            <div className="kpi-label">Open Issues</div>
            <div className="kpi-value" style={{ color: 'var(--warning)', fontSize: 22 }}>{openCount}</div>
          </div>
          <div className="kpi-card" style={{ flex: 1 }}>
            <div className="kpi-label">Total Cost (shown)</div>
            <div className="kpi-value" style={{ color: 'var(--danger)', fontSize: 22 }}>
              ₹{totalCost.toLocaleString()}
            </div>
          </div>
          <div className="kpi-card" style={{ flex: 1 }}>
            <div className="kpi-label">Total Logs</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{filtered.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search description…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 140 }} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="🔧" title="No maintenance logs" sub="Log maintenance when a vehicle needs servicing"
            action={isManager && <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> Log Maintenance</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Opened</th>
                  <th>Closed</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>
                      {l.vehicleRegistrationNumber ?? l.vehicleId}
                    </td>
                    <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.description}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>
                      ₹{Number(l.cost || 0).toLocaleString()}
                    </td>
                    <td><StatusBadge status={l.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {l.createdAt ? format(new Date(l.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {l.closedAt ? format(new Date(l.closedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    {isManager && (
                      <td>
                        {l.status === 'OPEN' && (
                          <button className="btn btn-sm btn-success" onClick={() => close(l)}>
                            <CheckCircle size={11}/> Close
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal
          title="Log Maintenance"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create} disabled={saving}>
                {saving ? 'Saving…' : 'Create Log'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Vehicle *</label>
            <select className="form-control" value={form.vehicleId} onChange={f('vehicleId')}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} ({v.status})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Description *</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={f('description')}
              placeholder="Engine oil change, brake pad replacement…" />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Estimated Cost (₹)</label>
            <input className="form-control" type="number" value={form.cost} onChange={f('cost')} placeholder="5000" />
          </div>
          <div className="alert alert-warning" style={{ marginTop: 14, fontSize: 12 }}>
            ⚠ Creating a maintenance log will automatically set the vehicle status to IN_SHOP.
          </div>
        </Modal>
      )}
    </>
  );
}
