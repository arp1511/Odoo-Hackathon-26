import { useState, useEffect, useCallback } from 'react';
import { maintenanceApi, vehiclesApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const EMPTY_FORM = { vehicleId: '', description: '', cost: '' };

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const isManager = hasRole('FLEET_MANAGER');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    maintenanceApi.list({})
      .then((r) => setLogs(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Failed to load maintenance logs'))
      .finally(() => setLoading(false));
  }, []);

  const loadVehicles = useCallback(() => {
    if (!isManager) return;
    vehiclesApi.list()
      .then((r) => setVehicles(r.data?.content ?? r.data ?? []))
      .catch(() => {});
  }, [isManager]);

  useEffect(() => { load(); loadVehicles(); }, [load, loadVehicles]);

  const createLog = async () => {
    if (!form.vehicleId || !form.description) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await maintenanceApi.create(form);
      toast.success('Maintenance log created — vehicle set to IN_SHOP');
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create log');
    } finally { setSaving(false); }
  };

  const closeLog = async (log) => {
    try {
      await maintenanceApi.close(log.id);
      toast.success('Maintenance closed — vehicle restored to AVAILABLE');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to close log');
    }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const getStatusColor = (status) => {
    return status === 'OPEN' ? 'var(--color-warning)' : 'var(--color-secondary)';
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Maintenance</h1>
        <p style={{ color: 'var(--text-muted)' }}>Vehicle maintenance tracking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: CREATE LOG FORM */}
        {isManager ? (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Log Service Record</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vehicle</label>
                <select className="input-field" value={form.vehicleId} onChange={f('vehicleId')} style={{ cursor: 'pointer' }}>
                  <option value="" style={{ background: 'var(--bg-dark)' }}>Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} style={{ background: 'var(--bg-dark)' }}>{v.registrationNumber}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Service Type / Description</label>
                <input className="input-field" value={form.description} onChange={f('description')} placeholder="Oil Change" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cost (₹)</label>
                <input className="input-field" type="number" value={form.cost} onChange={f('cost')} placeholder="2500" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Date</label>
                <input className="input-field" type="text" value={format(new Date(), 'dd/MM/yyyy')} disabled style={{ opacity: 0.7 }} />
              </div>

              <button className="btn btn-primary" onClick={createLog} disabled={saving} style={{ padding: '1rem', marginTop: '1rem' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-secondary)' }}>Available</span>
                  <span style={{ color: 'var(--text-muted)' }}>---- creating active record ----&gt;</span>
                  <span style={{ color: 'var(--color-warning)' }}>In Shop</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-warning)' }}>In Shop</span>
                  <span style={{ color: 'var(--text-muted)' }}>---- closing record (not retired) ----&gt;</span>
                  <span style={{ color: 'var(--color-secondary)' }}>Available</span>
                </div>
                <div style={{ color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                  Note: In Shop vehicles are removed from the dispatch pool.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            You do not have permission to log maintenance.
          </div>
        )}

        {/* RIGHT COLUMN: SERVICE LOGS */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Service Logs</h3>
          
          {loading ? <Spinner /> : logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No service logs found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem' }}>Vehicle</th>
                    <th style={{ padding: '1rem' }}>Service</th>
                    <th style={{ padding: '1rem' }}>Cost</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    {isManager && <th style={{ padding: '1rem' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>{l.vehicleRegistrationNumber ?? l.vehicleId}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{l.description}</td>
                      <td style={{ padding: '1rem', color: 'var(--color-danger)' }}>{l.cost ? Number(l.cost).toLocaleString() : '—'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', borderRadius: '4px', 
                          background: `rgba(${l.status === 'OPEN' ? '255, 184, 0' : '0, 255, 102'}, 0.1)`,
                          color: getStatusColor(l.status), fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                        }}>
                          {l.status === 'OPEN' ? 'In Shop' : 'Completed'}
                        </span>
                      </td>
                      {isManager && (
                        <td style={{ padding: '1rem' }}>
                          {l.status === 'OPEN' && (
                            <button onClick={() => closeLog(l)} style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                              <CheckCircle size={14}/> Close
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

      </div>
    </div>
  );
}
