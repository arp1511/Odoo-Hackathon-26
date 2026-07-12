import { useState, useEffect, useCallback } from 'react';
import { fuelApi, expensesApi, vehiclesApi, tripsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, Modal } from '../components/ui';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function FuelPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('FLEET_MANAGER', 'DISPATCHER');

  const [activeTab, setActiveTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [fuelForm, setFuelForm] = useState({ vehicleId: '', tripId: '', liters: '', cost: '', logDate: '' });
  const [expForm, setExpForm] = useState({ vehicleId: '', category: '', amount: '', expenseDate: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fuelApi.list(), expensesApi.list()])
      .then(([f, e]) => {
        setFuelLogs(f.data?.content ?? f.data ?? []);
        setExpenses(e.data?.content ?? e.data ?? []);
      })
      .catch(() => toast.error('Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openFuel = async () => {
    const [v, t] = await Promise.all([vehiclesApi.list(), tripsApi.list({ status: 'DISPATCHED' })]);
    setVehicles(v.data?.content ?? v.data ?? []);
    setTrips(t.data?.content ?? t.data ?? []);
    setFuelForm({ vehicleId: '', tripId: '', liters: '', cost: '', logDate: '' });
    setShowFuelModal(true);
  };

  const openExp = async () => {
    const v = await vehiclesApi.list();
    setVehicles(v.data?.content ?? v.data ?? []);
    setExpForm({ vehicleId: '', category: '', amount: '', expenseDate: '', description: '' });
    setShowExpModal(true);
  };

  const saveFuel = async () => {
    if (!fuelForm.vehicleId || !fuelForm.liters || !fuelForm.cost || !fuelForm.logDate) {
      toast.error('Fill required fields'); return;
    }
    setSaving(true);
    try {
      await fuelApi.create(fuelForm);
      toast.success('Fuel log added');
      setShowFuelModal(false);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const saveExp = async () => {
    if (!expForm.vehicleId || !expForm.category || !expForm.amount || !expForm.expenseDate) {
      toast.error('Fill required fields'); return;
    }
    setSaving(true);
    try {
      await expensesApi.create(expForm);
      toast.success('Expense added');
      setShowExpModal(false);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const totalFuel   = fuelLogs.reduce((s, l) => s + Number(l.cost || 0), 0);
  const totalExp    = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + Number(l.liters || 0), 0);

  const ff = (k) => (e) => setFuelForm({ ...fuelForm, [k]: e.target.value });
  const ef = (k) => (e) => setExpForm({ ...expForm, [k]: e.target.value });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Fuel & Expense Management</div>
          <div className="topbar-subtitle">Fuel logs and operational expenses</div>
        </div>
        <div className="topbar-actions">
          {canCreate && (
            <>
              <button className="btn btn-secondary" onClick={openExp}><Plus size={14}/> Add Expense</button>
              <button className="btn btn-primary"   onClick={openFuel}><Plus size={14}/> Log Fuel</button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Total Fuel Cost', val: `₹${totalFuel.toLocaleString()}`, color: 'var(--danger)' },
            { label: 'Total Fuel (L)',  val: `${totalLiters.toLocaleString()} L`, color: 'var(--info)' },
            { label: 'Total Expenses',  val: `₹${totalExp.toLocaleString()}`,  color: 'var(--warning)' },
            { label: 'Grand Total',     val: `₹${(totalFuel + totalExp).toLocaleString()}`, color: 'var(--accent)' },
          ].map(({ label, val, color }) => (
            <div className="kpi-card" style={{ flex: 1 }} key={label}>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value" style={{ color, fontSize: 20 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'fuel' ? 'active' : ''}`} onClick={() => setActiveTab('fuel')}>
            Fuel Logs ({fuelLogs.length})
          </button>
          <button className={`tab-btn ${activeTab === 'exp' ? 'active' : ''}`} onClick={() => setActiveTab('exp')}>
            Expenses ({expenses.length})
          </button>
        </div>

        {loading ? <Spinner /> : activeTab === 'fuel' ? (
          fuelLogs.length === 0 ? (
            <EmptyState icon="⛽" title="No fuel logs" sub="Log fuel after each trip"
              action={canCreate && <button className="btn btn-primary" onClick={openFuel}><Plus size={14}/> Log Fuel</button>} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trip</th>
                    <th>Liters (L)</th>
                    <th>Cost (₹)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                        {l.vehicleRegistrationNumber ?? l.vehicleId}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.tripId ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>{l.liters} L</td>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{Number(l.cost).toLocaleString()}</td>
                      <td style={{ fontSize: 12 }}>{l.logDate ? format(new Date(l.logDate), 'dd MMM yyyy') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          expenses.length === 0 ? (
            <EmptyState icon="💰" title="No expenses" sub="Record tolls, maintenance costs and more"
              action={canCreate && <button className="btn btn-secondary" onClick={openExp}><Plus size={14}/> Add Expense</button>} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Amount (₹)</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                        {e.vehicleRegistrationNumber ?? e.vehicleId}
                      </td>
                      <td>
                        <span className="badge" style={{
                          color: e.category === 'TOLL' ? 'var(--info)' : e.category === 'MAINTENANCE' ? 'var(--warning)' : 'var(--text-secondary)',
                          background: 'var(--bg-input)',
                        }}>
                          {e.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{Number(e.amount).toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.description ?? '—'}</td>
                      <td style={{ fontSize: 12 }}>{e.expenseDate ? format(new Date(e.expenseDate), 'dd MMM yyyy') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Fuel Modal */}
      {showFuelModal && (
        <Modal title="Log Fuel" onClose={() => setShowFuelModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFuel} disabled={saving}>{saving ? 'Saving…' : 'Add Log'}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vehicle *</label>
              <select className="form-control" value={fuelForm.vehicleId} onChange={ff('vehicleId')}>
                <option value="">Select…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trip (optional)</label>
              <select className="form-control" value={fuelForm.tripId} onChange={ff('tripId')}>
                <option value="">No trip</option>
                {trips.map((t) => <option key={t.id} value={t.id}>{t.source} → {t.destination}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Liters *</label>
              <input className="form-control" type="number" value={fuelForm.liters} onChange={ff('liters')} placeholder="40" />
            </div>
            <div className="form-group">
              <label className="form-label">Cost (₹) *</label>
              <input className="form-control" type="number" value={fuelForm.cost} onChange={ff('cost')} placeholder="3600" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={fuelForm.logDate} onChange={ff('logDate')} />
            </div>
          </div>
        </Modal>
      )}

      {/* Expense Modal */}
      {showExpModal && (
        <Modal title="Add Expense" onClose={() => setShowExpModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowExpModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveExp} disabled={saving}>{saving ? 'Saving…' : 'Add Expense'}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vehicle *</label>
              <select className="form-control" value={expForm.vehicleId} onChange={ef('vehicleId')}>
                <option value="">Select…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={expForm.category} onChange={ef('category')}>
                <option value="">Select…</option>
                {['TOLL','MAINTENANCE','OTHER'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input className="form-control" type="number" value={expForm.amount} onChange={ef('amount')} placeholder="1200" />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={expForm.expenseDate} onChange={ef('expenseDate')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <input className="form-control" value={expForm.description} onChange={ef('description')} placeholder="Highway toll — NH48" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
