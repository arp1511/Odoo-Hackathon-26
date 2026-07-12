import { useState, useEffect, useCallback } from 'react';
import { vehiclesApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, StatusBadge, Modal, ConfirmModal } from '../components/ui';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  registrationNumber: '', name: '', type: '', maxLoadCapacityKg: '',
  odometer_km: '', acquisitionCost: '', region: '', status: 'AVAILABLE',
};

export default function VehiclesPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole('FLEET_MANAGER');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    vehiclesApi.list()
      .then((r) => setVehicles(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true); };
  const openEdit = (v) => {
    setForm({
      registrationNumber: v.registrationNumber,
      name: v.name, type: v.type,
      maxLoadCapacityKg: v.maxLoadCapacityKg,
      odometer_km: v.odometerKm ?? '',
      acquisitionCost: v.acquisitionCost,
      region: v.region ?? '',
      status: v.status,
    });
    setEditTarget(v);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.registrationNumber || !form.name || !form.type || !form.maxLoadCapacityKg || !form.acquisitionCost) {
      toast.error('Please fill required fields'); return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await vehiclesApi.update(editTarget.id, form);
        toast.success('Vehicle updated');
      } else {
        await vehiclesApi.create(form);
        toast.success('Vehicle added');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await vehiclesApi.delete(deleteTarget.id);
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchQ = !q || v.name?.toLowerCase().includes(q) || v.registrationNumber?.toLowerCase().includes(q);
    const matchS = !statusFilter || v.status === statusFilter;
    return matchQ && matchS;
  });

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Vehicle Registry</div>
          <div className="topbar-subtitle">Manage your fleet vehicles</div>
        </div>
        <div className="topbar-actions">
          {isManager && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search vehicles…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['AVAILABLE','ON_TRIP','IN_SHOP','RETIRED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="🚛" title="No vehicles found" sub="Add your first vehicle to get started"
            action={isManager && <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> Add Vehicle</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reg. Number</th>
                  <th>Name / Type</th>
                  <th>Max Load (kg)</th>
                  <th>Odometer (km)</th>
                  <th>Acq. Cost</th>
                  <th>Region</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)' }}>
                      {v.registrationNumber}
                    </td>
                    <td>
                      <div>{v.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.type}</div>
                    </td>
                    <td>{Number(v.maxLoadCapacityKg).toLocaleString()}</td>
                    <td>{Number(v.odometerKm ?? 0).toLocaleString()}</td>
                    <td>₹{Number(v.acquisitionCost).toLocaleString()}</td>
                    <td>{v.region || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    {isManager && (
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="Edit" onClick={() => openEdit(v)}><Edit2 size={13}/></button>
                          <button className="btn-icon" title="Delete" onClick={() => setDeleteTarget(v)}
                            style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal
          title={editTarget ? `Edit — ${editTarget.registrationNumber}` : 'Add New Vehicle'}
          onClose={() => setShowForm(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Vehicle'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Registration Number *</label>
              <input className="form-control" value={form.registrationNumber} onChange={f('registrationNumber')}
                placeholder="MH-12-AB-1234" disabled={!!editTarget} />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Name *</label>
              <input className="form-control" value={form.name} onChange={f('name')} placeholder="Tata Prima 5528" />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <input className="form-control" value={form.type} onChange={f('type')} placeholder="Heavy Truck" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Load Capacity (kg) *</label>
              <input className="form-control" type="number" value={form.maxLoadCapacityKg} onChange={f('maxLoadCapacityKg')} placeholder="15000" />
            </div>
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input className="form-control" type="number" value={form.odometer_km} onChange={f('odometer_km')} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Acquisition Cost (₹) *</label>
              <input className="form-control" type="number" value={form.acquisitionCost} onChange={f('acquisitionCost')} placeholder="2500000" />
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <input className="form-control" value={form.region} onChange={f('region')} placeholder="Maharashtra" />
            </div>
            {editTarget && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={f('status')}>
                  {['AVAILABLE','ON_TRIP','IN_SHOP','RETIRED'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete "${deleteTarget.name}" (${deleteTarget.registrationNumber})? This action cannot be undone.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
