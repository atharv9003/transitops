import { useEffect, useState } from 'react';
import { getTrips, dispatchTrip, cancelTrip, completeTrip } from '../api/trips';
import { TripForm } from '../components/trips/TripForm';
import { useAuthStore } from '../store/authStore';

interface Trip {
  id: number;
  tripCode: string;
  status: string;
  source: string;
  destination: string;
  plannedDistance: number;
  cargoWeight?: number;
  revenueAmount: number;
  vehicle?: { regNumber: string; name: string; maxCapacity: number };
  driver?: { name: string };
}

const STATUS_CLASS: Record<string, string> = {
  Draft: 'badge-draft',
  Dispatched: 'badge-dispatched',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
};

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [completing, setCompleting] = useState<Trip | null>(null);
  const [completionData, setCompletionData] = useState({ odometerEnd: '', fuelLiters: '', fuelCost: '', toll: '', other: '' });
  const role = useAuthStore(s => s.role);
  const canDispatch = role === 'Dispatcher' || role === 'Fleet Manager';

  async function load() {
    setLoading(true);
    try {
      const data = await getTrips({ status: filterStatus || undefined });
      setTrips(data);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterStatus]);

  async function handleDispatch(id: number) {
    if (!confirm('Dispatch this trip?')) return;
    try { await dispatchTrip(id); load(); }
    catch (err: unknown) { alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed'); }
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this trip?')) return;
    await cancelTrip(id);
    load();
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completing) return;
    try {
      await completeTrip(completing.id, {
        odometerEnd: parseFloat(completionData.odometerEnd),
        fuelLiters: parseFloat(completionData.fuelLiters),
        fuelCost: parseFloat(completionData.fuelCost),
        toll: parseFloat(completionData.toll) || 0,
        other: parseFloat(completionData.other) || 0,
      });
      setCompleting(null);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to complete');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Management</h1>
          <div className="page-subtitle">Create, dispatch, and track trips</div>
        </div>
        {canDispatch && (
          <button id="create-trip-btn" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create Trip
          </button>
        )}
      </div>

      <div className="filter-row">
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state"><p>Loading trips…</p></div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <h3>No trips found</h3>
            <p>Create a trip to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Cargo (kg)</th>
                <th>Revenue</th>
                <th>Status</th>
                {canDispatch && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent)', fontFamily: 'monospace' }}>{t.tripCode}</td>
                  <td>{t.vehicle?.regNumber ?? '—'}</td>
                  <td>{t.driver?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {t.source} → {t.destination}
                    <div style={{ fontSize: '11px' }}>{t.plannedDistance} km</div>
                  </td>
                  <td>{t.cargoWeight ? `${t.cargoWeight} / ${t.vehicle?.maxCapacity}` : '—'}</td>
                  <td>₹{t.revenueAmount.toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_CLASS[t.status] ?? 'badge-draft'}`}>{t.status}</span></td>
                  {canDispatch && (
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {t.status === 'Draft' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleDispatch(t.id)}>Dispatch</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>Cancel</button>
                          </>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCompleting(t)}>Complete</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>Cancel</button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <TripForm onClose={() => setShowForm(false)} onSaved={load} />}

      {/* Complete Trip Modal */}
      {completing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Complete Trip — {completing.tripCode}</div>
              <button className="modal-close" onClick={() => setCompleting(null)}>×</button>
            </div>
            <form onSubmit={handleComplete}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Odometer End (km) *</label>
                  <input className="form-input" type="number" required value={completionData.odometerEnd}
                    onChange={e => setCompletionData(d => ({ ...d, odometerEnd: e.target.value }))} placeholder="56200" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Used (liters) *</label>
                  <input className="form-input" type="number" required value={completionData.fuelLiters}
                    onChange={e => setCompletionData(d => ({ ...d, fuelLiters: e.target.value }))} placeholder="28" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Cost (₹) *</label>
                  <input className="form-input" type="number" required value={completionData.fuelCost}
                    onChange={e => setCompletionData(d => ({ ...d, fuelCost: e.target.value }))} placeholder="2800" />
                </div>
                <div className="form-group">
                  <label className="form-label">Toll (₹)</label>
                  <input className="form-input" type="number" value={completionData.toll}
                    onChange={e => setCompletionData(d => ({ ...d, toll: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Other Expenses (₹)</label>
                  <input className="form-input" type="number" value={completionData.other}
                    onChange={e => setCompletionData(d => ({ ...d, other: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCompleting(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Mark Completed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
