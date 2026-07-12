import { useState } from 'react';
import { createVehicle, updateVehicle } from '../../api/vehicles';

interface Vehicle {
  id?: number;
  regNumber?: string;
  name?: string;
  type?: string;
  maxCapacity?: number;
  odometer?: number;
  acquisitionCost?: number;
}

interface VehicleFormProps {
  initial?: Vehicle;
  onClose: () => void;
  onSaved: () => void;
}

const VEHICLE_TYPES = ['Truck', 'Van', 'Mini', 'Bus', 'Other'];

export function VehicleForm({ initial, onClose, onSaved }: VehicleFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    regNumber: initial?.regNumber ?? '',
    name: initial?.name ?? '',
    type: initial?.type ?? 'Truck',
    maxCapacity: String(initial?.maxCapacity ?? ''),
    odometer: String(initial?.odometer ?? '0'),
    acquisitionCost: String(initial?.acquisitionCost ?? ''),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = {
        regNumber: form.regNumber,
        name: form.name,
        type: form.type,
        maxCapacity: parseFloat(form.maxCapacity),
        odometer: parseFloat(form.odometer),
        acquisitionCost: parseFloat(form.acquisitionCost),
      };
      if (isEdit && initial?.id) {
        await updateVehicle(initial.id, data);
      } else {
        await createVehicle(data);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save vehicle';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '16px' }}><span>⚠</span>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Registration Number *</label>
              <input className="form-input" name="regNumber" value={form.regNumber} onChange={change} placeholder="VAN-05" required disabled={isEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" name="type" value={form.type} onChange={change}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Vehicle Name / Model *</label>
              <input className="form-input" name="name" value={form.name} onChange={change} placeholder="Tata Ace Gold" required />
            </div>
            <div className="form-group">
              <label className="form-label">Max Capacity (kg) *</label>
              <input className="form-input" type="number" name="maxCapacity" value={form.maxCapacity} onChange={change} placeholder="500" required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input className="form-input" type="number" name="odometer" value={form.odometer} onChange={change} placeholder="0" min={0} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Acquisition Cost (₹) *</label>
              <input className="form-input" type="number" name="acquisitionCost" value={form.acquisitionCost} onChange={change} placeholder="850000" required min={0} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
