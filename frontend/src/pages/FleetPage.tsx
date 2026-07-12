import { useEffect, useState } from 'react';
import { getVehicles, deleteVehicle } from '../api/vehicles';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { useAuthStore } from '../store/authStore';

interface Vehicle {
  id: number;
  regNumber: string;
  name: string;
  type: string;
  status: string;
  maxCapacity: number;
  odometer: number;
  acquisitionCost: number;
}

const STATUS_CLASS: Record<string, string> = {
  Available: 'badge-available',
  OnTrip: 'badge-on-trip',
  InShop: 'badge-in-shop',
  Retired: 'badge-retired',
};

const STATUS_LABELS: Record<string, string> = {
  Available: 'Available',
  OnTrip: 'On Trip',
  InShop: 'In Shop',
  Retired: 'Retired',
};

export function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const role = useAuthStore(s => s.role);
  const canEdit = role === 'Fleet Manager';

  async function load() {
    setLoading(true);
    try {
      const data = await getVehicles({ status: filterStatus || undefined, type: filterType || undefined, search: search || undefined });
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterStatus, filterType, search]);

  async function handleDelete(id: number) {
    if (!confirm('Retire this vehicle?')) return;
    await deleteVehicle(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Registry</h1>
          <div className="page-subtitle">Manage and monitor your vehicle fleet</div>
        </div>
        {canEdit && (
          <button
            id="add-vehicle-btn"
            className="btn btn-primary"
            onClick={() => { setEditingVehicle(null); setShowForm(true); }}
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Search by reg number or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="OnTrip">On Trip</option>
          <option value="InShop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Mini">Mini</option>
          <option value="Bus">Bus</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state"><p>Loading vehicles…</p></div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <h3>No vehicles found</h3>
            <p>Add your first vehicle to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reg Number</th>
                <th>Vehicle Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Max Load (kg)</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{v.regNumber}</td>
                  <td>{v.name}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{v.type}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[v.status] ?? 'badge-draft'}`}>
                      {STATUS_LABELS[v.status] ?? v.status}
                    </span>
                  </td>
                  <td>{v.maxCapacity.toLocaleString()} kg</td>
                  <td>{v.odometer.toLocaleString()} km</td>
                  <td>₹{v.acquisitionCost.toLocaleString()}</td>
                  {canEdit && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setEditingVehicle(v); setShowForm(true); }}
                        >
                          Edit
                        </button>
                        {v.status !== 'Retired' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(v.id)}
                          >
                            Retire
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
        <VehicleForm
          initial={editingVehicle ?? undefined}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
