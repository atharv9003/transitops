import { useState } from 'react';
import { createDriver, updateDriver } from '../../api/drivers';

interface Driver {
  id?: number;
  name?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  contactNumber?: string;
  status?: string;
}

interface DriverFormProps {
  initial?: Driver;
  onClose: () => void;
  onSaved: () => void;
}

export function DriverForm({ initial, onClose, onSaved }: DriverFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    licenseNumber: initial?.licenseNumber ?? '',
    licenseExpiry: initial?.licenseExpiry ? initial.licenseExpiry.slice(0, 10) : '',
    contactNumber: initial?.contactNumber ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit && initial?.id) {
        await updateDriver(initial.id, { ...form, licenseExpiry: new Date(form.licenseExpiry).toISOString() });
      } else {
        await createDriver({ ...form, licenseExpiry: new Date(form.licenseExpiry).toISOString() });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save driver';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Driver' : 'Add Driver'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '16px' }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={change} placeholder="Rajesh Kumar" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">License Number *</label>
              <input className="form-input" name="licenseNumber" value={form.licenseNumber} onChange={change} placeholder="MH12 20190001234" required disabled={isEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">License Expiry *</label>
              <input className="form-input" type="date" name="licenseExpiry" value={form.licenseExpiry} onChange={change} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number *</label>
            <input className="form-input" name="contactNumber" value={form.contactNumber} onChange={change} placeholder="+91 9876543210" required />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? 'Update Driver' : 'Add Driver')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
