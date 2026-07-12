import { useState, useEffect, useCallback } from 'react';
import { tripsApi, vehiclesApi, driversApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, StatusBadge, Modal, Alert } from '../components/ui';
import { Plus, Search, Send, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EMPTY_FORM = {
  source: '', destination: '', vehicleId: '', driverId: '',
  cargoWeightKg: '', plannedDistanceKm: '', revenue: '',
};

export default function TripsPage() {
  const { hasRole } = useAuth();
  const isDispatcher = hasRole('DISPATCHER');

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actualDistanceKm: '', fuelConsumedL: '' });

  const load = useCallback(() => {
    setLoading(true);
    tripsApi.list(statusFilter ? { status: statusFilter } : {})
      .then((r) => setTrips(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    try {
      const [vRes, dRes] = await Promise.all([vehiclesApi.available(), driversApi.available()]);
      setVehicles(vRes.data ?? []);
      setDrivers(dRes.data ?? []);
    } catch { toast.error('Could not load available resources'); return; }
    setShowCreate(true);
  };

  const createTrip = async () => {
    const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } = form;
    if (!source || !destination || !vehicleId || !driverId || !cargoWeightKg || !plannedDistanceKm) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      await tripsApi.create(form);
      toast.success('Trip created as DRAFT');
      setShowCreate(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create trip');
    } finally { setSaving(false); }
  };

  const dispatch = async (trip) => {
    try {
      await tripsApi.dispatch(trip.id);
      toast.success('Trip dispatched!');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Dispatch failed');
    }
  };

  const cancel = async (trip) => {
    try {
      await tripsApi.cancel(trip.id);
      toast.success('Trip cancelled');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Cancel failed');
    }
  };

  const complete = async () => {
    const { actualDistanceKm, fuelConsumedL } = completeForm;
    if (!actualDistanceKm || !fuelConsumedL) { toast.error('Enter actual distance & fuel consumed'); return; }
    try {
      await tripsApi.complete(completeTarget.id, completeForm);
      toast.success('Trip completed!');
      setCompleteTarget(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Complete failed');
    }
  };

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.source?.toLowerCase().includes(q) || t.destination?.toLowerCase().includes(q);
  });

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Trip Dispatch</div>
          <div className="topbar-subtitle">Create, dispatch & track trips</div>
        </div>
        <div className="topbar-actions">
          {isDispatcher && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> New Trip
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search source/dest…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['DRAFT','DISPATCHED','COMPLETED','CANCELLED'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="🛣️" title="No trips found" sub="Create a new trip to get started"
            action={isDispatcher && <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> New Trip</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo (kg)</th>
                  <th>Dist. (km)</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Created</th>
                  {isDispatcher && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.source}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {t.destination}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{t.vehicleRegistrationNumber ?? t.vehicleId}</td>
                    <td style={{ fontSize: 12 }}>{t.driverName ?? t.driverId}</td>
                    <td>{Number(t.cargoWeightKg).toLocaleString()}</td>
                    <td>{t.plannedDistanceKm}</td>
                    <td>₹{t.revenue ? Number(t.revenue).toLocaleString() : '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t.createdAt ? format(new Date(t.createdAt), 'dd MMM') : '—'}
                    </td>
                    {isDispatcher && (
                      <td>
                        <div className="table-actions">
                          {t.status === 'DRAFT' && (
                            <button className="btn btn-sm btn-primary" onClick={() => dispatch(t)}>
                              <Send size={11}/> Dispatch
                            </button>
                          )}
                          {t.status === 'DISPATCHED' && (
                            <>
                              <button className="btn btn-sm btn-success" onClick={() => { setCompleteTarget(t); setCompleteForm({ actualDistanceKm: '', fuelConsumedL: '' }); }}>
                                <CheckCircle size={11}/> Complete
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => cancel(t)}>
                                <XCircle size={11}/> Cancel
                              </button>
                            </>
                          )}
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

      {/* Create Trip Modal */}
      {showCreate && (
        <Modal
          title="Create New Trip"
          onClose={() => setShowCreate(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTrip} disabled={saving}>
                {saving ? 'Creating…' : 'Create Trip (DRAFT)'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Source *</label>
              <input className="form-control" value={form.source} onChange={f('source')} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input className="form-control" value={form.destination} onChange={f('destination')} placeholder="Pune" />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle (Available) *</label>
              <select className="form-control" value={form.vehicleId} onChange={f('vehicleId')}>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} ({v.maxLoadCapacityKg}kg)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Driver (Available) *</label>
              <select className="form-control" value={form.driverId} onChange={f('driverId')}>
                <option value="">Select driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Weight (kg) *</label>
              <input className="form-control" type="number" value={form.cargoWeightKg} onChange={f('cargoWeightKg')} placeholder="5000" />
            </div>
            <div className="form-group">
              <label className="form-label">Planned Distance (km) *</label>
              <input className="form-control" type="number" value={form.plannedDistanceKm} onChange={f('plannedDistanceKm')} placeholder="200" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Revenue (₹) — manual estimate</label>
              <input className="form-control" type="number" value={form.revenue} onChange={f('revenue')} placeholder="50000" />
            </div>
          </div>
          <div className="alert alert-info" style={{ marginTop: 14, fontSize: 12 }}>
            ℹ Dispatch will be validated server-side: vehicle must be AVAILABLE, driver must be AVAILABLE with a valid license, and cargo must not exceed vehicle capacity.
          </div>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {completeTarget && (
        <Modal
          title={`Complete Trip — ${completeTarget.source} → ${completeTarget.destination}`}
          onClose={() => setCompleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setCompleteTarget(null)}>Cancel</button>
              <button className="btn btn-success" onClick={complete}>Mark as Completed</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Actual Distance (km) *</label>
              <input className="form-control" type="number"
                value={completeForm.actualDistanceKm}
                onChange={(e) => setCompleteForm({ ...completeForm, actualDistanceKm: e.target.value })}
                placeholder="215" />
            </div>
            <div className="form-group">
              <label className="form-label">Fuel Consumed (L) *</label>
              <input className="form-control" type="number"
                value={completeForm.fuelConsumedL}
                onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedL: e.target.value })}
                placeholder="40" />
            </div>
          </div>
          <div className="alert alert-warning" style={{ marginTop: 14, fontSize: 12 }}>
            ⚠ After completing, vehicle and driver status will automatically change to AVAILABLE.
          </div>
        </Modal>
      )}
    </>
  );
}
