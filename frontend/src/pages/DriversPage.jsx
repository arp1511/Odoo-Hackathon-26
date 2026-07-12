import { useState, useEffect, useCallback } from 'react';
import { driversApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, StatusBadge, Modal, Alert } from '../components/ui';
import { Plus, Search, Edit2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

const EMPTY_FORM = {
  name: '', licenseNumber: '', licenseCategory: '',
  licenseExpiry: '', contactNumber: '', status: 'AVAILABLE',
};

export default function DriversPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');
  const isSafety  = hasRole('SAFETY_OFFICER');

  const [drivers, setDrivers] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      driversApi.list(),
      isSafety ? driversApi.expiringLicenses(30) : Promise.resolve({ data: [] }),
    ])
      .then(([dr, ex]) => {
        setDrivers(dr.data?.content ?? dr.data ?? []);
        setExpiring(ex.data ?? []);
      })
      .catch(() => toast.error('Failed to load drivers'))
      .finally(() => setLoading(false));
  }, [isSafety]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true); };
  const openEdit = (d) => {
    setForm({
      name: d.name, licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry?.slice(0, 10) ?? '',
      contactNumber: d.contactNumber,
      status: d.status,
    });
    setEditTarget(d);
    setShowForm(true);
  };

  const save = async () => {
    const req = Object.values(form).every(Boolean);
    if (!form.name || !form.licenseNumber || !form.licenseCategory || !form.licenseExpiry || !form.contactNumber) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await driversApi.update(editTarget.id, form);
        toast.success('Driver updated');
      } else {
        await driversApi.create(form);
        toast.success('Driver added');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const suspendDriver = async (d) => {
    const nextStatus = d.status === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED';
    try {
      await driversApi.patchStatus(d.id, nextStatus);
      toast.success(`Driver ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reinstated'}`);
      load();
    } catch { toast.error('Status update failed'); }
  };

  const filtered = (activeTab === 'expiring' ? expiring : drivers).filter((d) => {
    const q = search.toLowerCase();
    const matchQ = !q || d.name?.toLowerCase().includes(q) || d.licenseNumber?.toLowerCase().includes(q);
    const matchS = !statusFilter || d.status === statusFilter;
    return matchQ && matchS;
  });

  const daysUntilExpiry = (exp) => differenceInDays(new Date(exp), new Date());
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Drivers & Safety</div>
          <div className="topbar-subtitle">Driver profiles, licenses & safety scores</div>
        </div>
        <div className="topbar-actions">
          {expiring.length > 0 && (
            <div className="alert alert-warning" style={{ padding: '5px 10px', fontSize: 12 }}>
              <AlertTriangle size={13} /> {expiring.length} expiring licenses
            </div>
          )}
          {canManage && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Drivers ({drivers.length})
          </button>
          {isSafety && (
            <button className={`tab-btn ${activeTab === 'expiring' ? 'active' : ''}`} onClick={() => setActiveTab('expiring')}>
              ⚠ Expiring Licenses ({expiring.length})
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search drivers…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['AVAILABLE','ON_TRIP','OFF_DUTY','SUSPENDED'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="👤" title="No drivers found" sub="Add drivers to start assigning trips"
            action={canManage && <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> Add Driver</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License No.</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>Contact</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const days = daysUntilExpiry(d.licenseExpiry);
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{d.licenseNumber}</td>
                      <td>{d.licenseCategory}</td>
                      <td>
                        <div style={{ color: days <= 7 ? 'var(--danger)' : days <= 30 ? 'var(--warning)' : 'inherit' }}>
                          {d.licenseExpiry ? format(parseISO(d.licenseExpiry), 'dd MMM yyyy') : '—'}
                          {days <= 30 && days > 0 && (
                            <div style={{ fontSize: 10, opacity: .8 }}>⚠ {days}d left</div>
                          )}
                          {days <= 0 && <div style={{ fontSize: 10 }}>❌ Expired</div>}
                        </div>
                      </td>
                      <td>{d.contactNumber}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 60, height: 6, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${d.safetyScore}%`, height: '100%',
                              background: d.safetyScore > 70 ? 'var(--success)' : d.safetyScore > 40 ? 'var(--warning)' : 'var(--danger)',
                              borderRadius: 99,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{d.safetyScore}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={d.status} /></td>
                      {canManage && (
                        <td>
                          <div className="table-actions">
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}><Edit2 size={13}/></button>
                            {isSafety && (
                              <button
                                className={`btn btn-sm ${d.status === 'SUSPENDED' ? 'btn-success' : 'btn-danger'}`}
                                onClick={() => suspendDriver(d)}
                              >
                                {d.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editTarget ? `Edit — ${editTarget.name}` : 'Add New Driver'}
          onClose={() => setShowForm(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Driver'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={f('name')} placeholder="Rajesh Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">License Number *</label>
              <input className="form-control" value={form.licenseNumber} onChange={f('licenseNumber')}
                placeholder="MH-04-20190012345" disabled={!!editTarget} />
            </div>
            <div className="form-group">
              <label className="form-label">License Category *</label>
              <select className="form-control" value={form.licenseCategory} onChange={f('licenseCategory')}>
                <option value="">Select…</option>
                {['LMV','HMV','HGMV','TRANS'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">License Expiry *</label>
              <input className="form-control" type="date" value={form.licenseExpiry} onChange={f('licenseExpiry')} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number *</label>
              <input className="form-control" value={form.contactNumber} onChange={f('contactNumber')} placeholder="+91-98765-43210" />
            </div>
            {editTarget && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={f('status')}>
                  {['AVAILABLE','ON_TRIP','OFF_DUTY','SUSPENDED'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
