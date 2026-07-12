import { useState, useEffect, useCallback } from 'react';
import { tripsApi, vehiclesApi, driversApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { Send, CheckCircle, XCircle } from 'lucide-react';

const EMPTY_FORM = {
  source: '', destination: '', vehicleId: '', driverId: '',
  cargoWeightKg: '', plannedDistanceKm: '', revenue: '',
};

export default function TripsPage() {
  const { hasRole } = useAuth();
  const isDispatcher = hasRole('DISPATCHER') || hasRole('FLEET_MANAGER');

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    tripsApi.list({})
      .then((r) => setTrips(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const loadResources = useCallback(() => {
    if (!isDispatcher) return;
    Promise.all([vehiclesApi.available(), driversApi.available()])
      .then(([vRes, dRes]) => {
        setVehicles(vRes.data ?? []);
        setDrivers(dRes.data ?? []);
      })
      .catch(() => toast.error('Could not load available resources'));
  }, [isDispatcher]);

  useEffect(() => { load(); loadResources(); }, [load, loadResources]);

  const createTrip = async () => {
    const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } = form;
    if (!source || !destination || !vehicleId || !driverId || !cargoWeightKg || !plannedDistanceKm) {
      toast.error('Fill all required fields'); return;
    }
    
    // Capacity Check
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle && Number(cargoWeightKg) > selectedVehicle.maxLoadCapacityKg) {
      toast.error(`Capacity exceeded! Vehicle max is ${selectedVehicle.maxLoadCapacityKg}kg.`);
      return;
    }

    setSaving(true);
    try {
      await tripsApi.create(form);
      toast.success('Trip created as DRAFT');
      setForm(EMPTY_FORM);
      load();
      loadResources();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create trip');
    } finally { setSaving(false); }
  };

  const dispatchTrip = async (trip) => {
    try {
      await tripsApi.dispatch(trip.id);
      toast.success('Trip dispatched!');
      load();
      loadResources();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Dispatch failed');
    }
  };

  const cancelTrip = async (trip) => {
    try {
      await tripsApi.cancel(trip.id);
      toast.success('Trip cancelled');
      load();
      loadResources();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Cancel failed');
    }
  };

  const completeTrip = async (trip) => {
    const actualDistanceKm = prompt('Enter actual distance (km):', trip.plannedDistanceKm);
    if (!actualDistanceKm) return;
    const fuelConsumedL = prompt('Enter fuel consumed (L):', '40');
    if (!fuelConsumedL) return;

    try {
      await tripsApi.complete(trip.id, { actualDistanceKm, fuelConsumedL });
      toast.success('Trip completed!');
      load();
      loadResources();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Complete failed');
    }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const getStatusColor = (status) => {
    switch(status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'DISPATCHED': return 'var(--color-primary)';
      case 'COMPLETED': return 'var(--color-secondary)';
      case 'CANCELLED': return 'var(--color-danger)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Trip Dispatcher</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage trip lifecycles and dispatch vehicles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: CREATE TRIP FORM */}
        {isDispatcher ? (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Create Trip</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Source</label>
                <input className="input-field" value={form.source} onChange={f('source')} placeholder="Gandhinagar Depot" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Destination</label>
                <input className="input-field" value={form.destination} onChange={f('destination')} placeholder="Ahmedabad Hub" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vehicle (Available Only)</label>
                <select className="input-field" value={form.vehicleId} onChange={f('vehicleId')} style={{ cursor: 'pointer' }}>
                  <option value="" style={{ background: 'var(--bg-dark)' }}>Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} style={{ background: 'var(--bg-dark)' }}>{v.registrationNumber} ({v.maxLoadCapacityKg}kg)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Driver (Available Only)</label>
                <select className="input-field" value={form.driverId} onChange={f('driverId')} style={{ cursor: 'pointer' }}>
                  <option value="" style={{ background: 'var(--bg-dark)' }}>Select driver…</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} style={{ background: 'var(--bg-dark)' }}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cargo Weight (kg)</label>
                  <input className="input-field" type="number" value={form.cargoWeightKg} onChange={f('cargoWeightKg')} placeholder="700" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Distance (km)</label>
                  <input className="input-field" type="number" value={form.plannedDistanceKm} onChange={f('plannedDistanceKm')} placeholder="38" />
                </div>
              </div>

              {/* Dynamic Validation Warning based on Excalidraw */}
              {form.vehicleId && form.cargoWeightKg && (
                (() => {
                  const v = vehicles.find(v => v.id === form.vehicleId);
                  if (v && Number(form.cargoWeightKg) > v.maxLoadCapacityKg) {
                    return (
                      <div style={{ padding: '1rem', border: '1px solid var(--color-danger)', background: 'rgba(255, 0, 60, 0.1)', borderRadius: '4px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>Vehicle Capacity: {v.maxLoadCapacityKg} kg</div>
                        <div>Cargo Weight: {form.cargoWeightKg} kg</div>
                        <div style={{ marginTop: '0.5rem', fontWeight: 700 }}>⚠ Capacity exceeded by {Number(form.cargoWeightKg) - v.maxLoadCapacityKg} kg — dispatch blocked</div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <button className="btn btn-primary" onClick={createTrip} disabled={saving} style={{ padding: '1rem', marginTop: '1rem' }}>
                {saving ? 'Creating…' : 'Create Trip (Draft)'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            You do not have permission to create trips.
          </div>
        )}

        {/* RIGHT COLUMN: LIVE BOARD */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live Board</h3>
          
          {loading ? <Spinner /> : trips.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No trips active.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trips.map(t => (
                <div key={t.id} style={{ 
                  padding: '1.25rem', 
                  border: '1px dashed var(--border-light)', 
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{t.source} → {t.destination}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>Trip ID: {t.id.split('-')[0].toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{t.vehicleRegistrationNumber ?? t.vehicleId} / {t.driverName ?? t.driverId}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.plannedDistanceKm} km</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '4px', 
                      background: `rgba(${t.status === 'DISPATCHED' ? '0, 240, 255' : t.status === 'COMPLETED' ? '0, 255, 102' : t.status === 'CANCELLED' ? '255, 0, 60' : '255,255,255'}, 0.1)`,
                      border: `1px solid ${getStatusColor(t.status)}`,
                      color: getStatusColor(t.status),
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {t.status}
                    </div>
                    
                    {isDispatcher && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {t.status === 'DRAFT' && (
                          <button className="btn btn-primary" onClick={() => dispatchTrip(t)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                            <Send size={12}/> Dispatch
                          </button>
                        )}
                        {t.status === 'DISPATCHED' && (
                          <>
                            <button className="btn" onClick={() => completeTrip(t)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(0, 255, 102, 0.1)', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)' }}>
                              <CheckCircle size={12}/> Complete
                            </button>
                            <button className="btn" onClick={() => cancelTrip(t)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(255, 0, 60, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
                              <XCircle size={12}/> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
