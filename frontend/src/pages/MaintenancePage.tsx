import { useEffect, useState } from 'react';
import { getMaintenance, createMaintenance, closeMaintenance } from '../api/operations';
import { getVehicles } from '../api/vehicles';
import { useAuthStore } from '../store/authStore';

interface MaintenanceRecord {
  id: number;
  serviceType: string;
  description?: string;
  cost: number;
  date: string;
  status: string;
  vehicle: { regNumber: string; name: string };
}

interface Vehicle { id: number; regNumber: string; name: string; }

export function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', description: '', cost: '', date: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const role = useAuthStore(s => s.role);
  const canManage = role === 'Fleet Manager';

  async function load() {
    setLoading(true);
    try {
      const data = await getMaintenance({ status: filterStatus || undefined });
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); getVehicles().then(setVehicles); }, [filterStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await createMaintenance({ vehicleId: Number(form.vehicleId), serviceType: form.serviceType, description: form.description || undefined, cost: parseFloat(form.cost), date: form.date });
      setShowForm(false);
      setForm({ vehicleId: '', serviceType: '', description: '', cost: '', date: '' });
      load();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Log</h1>
          <div className="page-subtitle">Track vehicle service and repair records</div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Record</button>
        )}
      </div>

      <div className="filter-row">
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? <div className="empty-state"><p>Loading…</p></div> : records.length === 0 ? (
          <div className="empty-state"><h3>No records</h3><p>Add a maintenance record to get started.</p></div>
        ) : (
          <table>
            <thead>
              <tr><th>Vehicle</th><th>Service Type</th><th>Description</th><th>Cost</th><th>Date</th><th>Status</th>{canManage && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.vehicle.regNumber}</td>
                  <td>{r.serviceType}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{r.description ?? '—'}</td>
                  <td>₹{r.cost.toLocaleString()}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge badge-${r.status === 'Active' ? 'active' : 'completed'}`}>{r.status}</span></td>
                  {canManage && r.status === 'Active' && (
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={async () => { await closeMaintenance(r.id); load(); }}>
                        Close
                      </button>
                    </td>
                  )}
                  {canManage && r.status === 'Completed' && <td>—</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Maintenance Record</div>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            {formError && <div className="form-error" style={{ marginBottom: '12px' }}><span>⚠</span> {formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Vehicle *</label>
                <select className="form-select" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                  <option value="">— Select vehicle —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Service Type *</label>
                  <input className="form-input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} placeholder="Oil Change" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cost (₹) *</label>
                <input className="form-input" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="2500" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details…" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Saving…' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
