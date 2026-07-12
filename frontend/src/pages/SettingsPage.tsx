import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/analytics';
import { useAuthStore } from '../store/authStore';

interface Settings {
  id: number;
  depotName: string;
  currency: string;
  distanceUnit: string;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ depotName: '', currency: '', distanceUnit: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const role = useAuthStore(s => s.role);
  const canEdit = role === 'Fleet Manager';

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setForm({ depotName: s.depotName, currency: s.currency, distanceUnit: s.distanceUnit });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const updated = await updateSettings(form);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Depot configuration and system preferences</div>
        </div>
      </div>

      <div style={{ maxWidth: '540px' }}>
        <div className="card">
          <div className="card-title">Depot Settings</div>

          {saved && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-available)', fontSize: '13px', marginBottom: '16px' }}>
              ✓ Settings saved successfully
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Depot / Company Name</label>
              <input
                className="form-input"
                value={form.depotName}
                onChange={e => setForm(f => ({ ...f, depotName: e.target.value }))}
                placeholder="Main Depot"
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                disabled={!canEdit}
              >
                <option value="INR (Rs)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Distance Unit</label>
              <select
                className="form-select"
                value={form.distanceUnit}
                onChange={e => setForm(f => ({ ...f, distanceUnit: e.target.value }))}
                disabled={!canEdit}
              >
                <option value="Kilometers">Kilometers</option>
                <option value="Miles">Miles</option>
              </select>
            </div>

            {canEdit && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Settings'}
              </button>
            )}
          </form>
        </div>

        {/* App info */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-title">Application Info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Application</span>
              <span style={{ fontWeight: 600 }}>TransitOps</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Version</span>
              <span>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Your Role</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Depot Name</span>
              <span>{settings?.depotName ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
