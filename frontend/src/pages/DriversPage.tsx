import { useEffect, useState } from 'react';
import { getDrivers, deleteDriver } from '../api/drivers';
import { DriverForm } from '../components/drivers/DriverForm';
import { useAuthStore } from '../store/authStore';

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  contactNumber: string;
  status: string;
}

const STATUS_CLASS: Record<string, string> = {
  Available: 'badge-available',
  OnTrip: 'badge-on-trip',
  OffDuty: 'badge-off-duty',
  Suspended: 'badge-suspended',
};

const STATUS_LABELS: Record<string, string> = {
  Available: 'Available',
  OnTrip: 'On Trip',
  OffDuty: 'Off Duty',
  Suspended: 'Suspended',
};

function expiryBadge(expiry: string) {
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dateStr = new Date(expiry).toLocaleDateString('en-IN');
  if (days < 0) return <span style={{ color: 'var(--color-retired)', fontSize: '12px' }}>⚠ Expired ({dateStr})</span>;
  if (days <= 30) return <span style={{ color: 'var(--color-in-shop)', fontSize: '12px' }}>⚠ {dateStr} ({days}d)</span>;
  return <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{dateStr}</span>;
}

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const role = useAuthStore(s => s.role);
  const canEdit = role === 'Fleet Manager' || role === 'Dispatcher';

  async function load() {
    setLoading(true);
    try {
      const data = await getDrivers({ status: filterStatus || undefined, search: search || undefined });
      setDrivers(data);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterStatus, search]);

  async function handleDelete(id: number) {
    if (!confirm('Suspend this driver?')) return;
    await deleteDriver(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Registry</h1>
          <div className="page-subtitle">Manage drivers, track license validity</div>
        </div>
        {canEdit && (
          <button
            id="add-driver-btn"
            className="btn btn-primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            + Add Driver
          </button>
        )}
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Search drivers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="OnTrip">On Trip</option>
          <option value="OffDuty">Off Duty</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state"><p>Loading drivers…</p></div>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <h3>No drivers found</h3>
            <p>Add your first driver to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>License No.</th>
                <th>License Expiry</th>
                <th>Contact</th>
                <th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>{d.licenseNumber}</td>
                  <td>{expiryBadge(d.licenseExpiry)}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{d.contactNumber}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[d.status] ?? 'badge-draft'}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(d); setShowForm(true); }}>
                          Edit
                        </button>
                        {d.status !== 'Suspended' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                            Suspend
                          </button>
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

      {showForm && (
        <DriverForm
          initial={editing ?? undefined}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
