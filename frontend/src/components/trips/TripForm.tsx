import { useState, useEffect } from 'react';
import { createTrip } from '../../api/trips';
import { getAvailableVehicles } from '../../api/vehicles';
import { getAvailableDrivers } from '../../api/drivers';

interface Vehicle { id: number; regNumber: string; name: string; maxCapacity: number; }
interface Driver  { id: number; name: string; licenseNumber: string; }

interface TripFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export function TripForm({ onClose, onSaved }: TripFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    source: '',
    destination: '',
    plannedDistance: '',
    cargoDescription: '',
    cargoWeight: '',
    revenueAmount: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getAvailableVehicles(), getAvailableDrivers()]).then(([v, d]) => {
      setVehicles(v);
      setDrivers(d);
    });
  }, []);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTrip({
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        source: form.source,
        destination: form.destination,
        plannedDistance: parseFloat(form.plannedDistance),
        cargoDescription: form.cargoDescription || undefined,
        cargoWeight: parseFloat(form.cargoWeight) || undefined,
        revenueAmount: parseFloat(form.revenueAmount) || 0,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create trip';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedVehicle = vehicles.find(v => String(v.id) === form.vehicleId);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div className="modal-title">Create Trip</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '16px' }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Vehicle *</label>
              <select className="form-select" name="vehicleId" value={form.vehicleId} onChange={change} required>
                <option value="">— Select vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.regNumber} — {v.name} ({v.maxCapacity}kg)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Driver *</label>
              <select className="form-select" name="driverId" value={form.driverId} onChange={change} required>
                <option value="">— Select driver —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Source *</label>
              <input className="form-input" name="source" value={form.source} onChange={change} placeholder="Mumbai" required />
            </div>
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input className="form-input" name="destination" value={form.destination} onChange={change} placeholder="Pune" required />
            </div>
            <div className="form-group">
              <label className="form-label">Planned Distance (km) *</label>
              <input className="form-input" type="number" name="plannedDistance" value={form.plannedDistance} onChange={change} placeholder="180" required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Weight (kg)</label>
              <input
                className="form-input" type="number" name="cargoWeight" value={form.cargoWeight}
                onChange={change} placeholder={selectedVehicle ? `max ${selectedVehicle.maxCapacity}kg` : '0'}
                min={0} max={selectedVehicle?.maxCapacity}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Cargo Description</label>
              <input className="form-input" name="cargoDescription" value={form.cargoDescription} onChange={change} placeholder="Electronics, fragile" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Revenue Amount (₹)</label>
              <input className="form-input" type="number" name="revenueAmount" value={form.revenueAmount} onChange={change} placeholder="12000" min={0} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
