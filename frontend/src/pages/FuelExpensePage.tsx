import { useEffect, useState } from 'react';
import { getFuelLogs, createFuelLog, getExpenses, createExpense } from '../api/operations';
import { getVehicles } from '../api/vehicles';
import { useAuthStore } from '../store/authStore';

interface FuelLog {
  id: number;
  liters: number;
  cost: number;
  date: string;
  vehicle: { regNumber: string };
  trip?: { tripCode: string };
}

interface Expense {
  id: number;
  toll: number;
  other: number;
  total: number;
  createdAt: string;
  vehicle: { regNumber: string };
  trip?: { tripCode: string };
}

interface Vehicle { id: number; regNumber: string; name: string; }

export function FuelExpensePage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel');
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '', date: '' });
  const [expForm, setExpForm] = useState({ vehicleId: '', toll: '', other: '' });
  const role = useAuthStore(s => s.role);
  const canEdit = role === 'Fleet Manager' || role === 'Financial Analyst' || role === 'Dispatcher';

  async function load() {
    setLoading(true);
    try {
      const [f, e, v] = await Promise.all([getFuelLogs(), getExpenses(), getVehicles()]);
      setFuelLogs(f);
      setExpenses(e);
      setVehicles(v);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFuelSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createFuelLog({ vehicleId: Number(fuelForm.vehicleId), liters: parseFloat(fuelForm.liters), cost: parseFloat(fuelForm.cost), date: fuelForm.date });
    setShowFuelForm(false);
    setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' });
    load();
  }

  async function handleExpSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createExpense({ vehicleId: Number(expForm.vehicleId), toll: parseFloat(expForm.toll) || 0, other: parseFloat(expForm.other) || 0 });
    setShowExpenseForm(false);
    setExpForm({ vehicleId: '', toll: '', other: '' });
    load();
  }

  const totalFuel = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel & Expenses</h1>
          <div className="page-subtitle">Track fuel consumption and operational expenses</div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowExpenseForm(true)}>+ Expense</button>
            <button className="btn btn-primary" onClick={() => setShowFuelForm(true)}>+ Fuel Log</button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ '--kpi-color': '#3b82f6' } as React.CSSProperties}>
          <div className="kpi-label">Total Fuel Cost</div>
          <div className="kpi-value">₹{totalFuel.toLocaleString()}</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#f59e0b' } as React.CSSProperties}>
          <div className="kpi-label">Total Expenses</div>
          <div className="kpi-value">₹{totalExpenses.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Combined Operational</div>
          <div className="kpi-value">₹{(totalFuel + totalExpenses).toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
        {(['fuel', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontWeight: 600, fontSize: '13px',
            color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
          }}>
            {t === 'fuel' ? '⛽ Fuel Logs' : '📋 Other Expenses'}
          </button>
        ))}
      </div>

      {loading ? <div className="empty-state"><p>Loading…</p></div> : (
        <>
          {tab === 'fuel' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Vehicle</th><th>Trip</th><th>Liters</th><th>Cost</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {fuelLogs.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No fuel logs</td></tr>
                  ) : fuelLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.vehicle.regNumber}</td>
                      <td style={{ color: 'var(--color-accent)', fontSize: '12px' }}>{l.trip?.tripCode ?? '—'}</td>
                      <td>{l.liters} L</td>
                      <td>₹{l.cost.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'expenses' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Vehicle</th><th>Trip</th><th>Toll</th><th>Other</th><th>Total</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No expenses</td></tr>
                  ) : expenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.vehicle.regNumber}</td>
                      <td style={{ color: 'var(--color-accent)', fontSize: '12px' }}>{e.trip?.tripCode ?? '—'}</td>
                      <td>₹{e.toll}</td>
                      <td>₹{e.other}</td>
                      <td style={{ fontWeight: 600 }}>₹{e.total.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Fuel Form Modal */}
      {showFuelForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Log Fuel Fill-Up</div>
              <button className="modal-close" onClick={() => setShowFuelForm(false)}>×</button>
            </div>
            <form onSubmit={handleFuelSubmit}>
              <div className="form-group">
                <label className="form-label">Vehicle *</label>
                <select className="form-select" value={fuelForm.vehicleId} onChange={e => setFuelForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                  <option value="">— Select —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Liters *</label>
                  <input className="form-input" type="number" step="0.1" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost (₹) *</label>
                  <input className="form-input" type="number" value={fuelForm.cost} onChange={e => setFuelForm(f => ({ ...f, cost: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFuelForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Fuel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Expense</div>
              <button className="modal-close" onClick={() => setShowExpenseForm(false)}>×</button>
            </div>
            <form onSubmit={handleExpSubmit}>
              <div className="form-group">
                <label className="form-label">Vehicle *</label>
                <select className="form-select" value={expForm.vehicleId} onChange={e => setExpForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                  <option value="">— Select —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Toll (₹)</label>
                  <input className="form-input" type="number" value={expForm.toll} onChange={e => setExpForm(f => ({ ...f, toll: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Other (₹)</label>
                  <input className="form-input" type="number" value={expForm.other} onChange={e => setExpForm(f => ({ ...f, other: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
