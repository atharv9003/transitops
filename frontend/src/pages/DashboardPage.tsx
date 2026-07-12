import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { KpiCard } from '../components/dashboard/KpiCard';
import { getDashboardKpis, getRecentTrips } from '../api/dashboard';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Dispatched: 'badge-dispatched', Completed: 'badge-completed',
    Draft: 'badge-draft', Cancelled: 'badge-cancelled',
  };
  return <span className={`badge ${map[status] ?? 'badge-draft'}`}>{status}</span>;
}

const STATUS_COLORS = {
  available: 'var(--color-available)',
  onTrip: 'var(--color-on-trip)',
  inShop: 'var(--color-in-shop)',
  retired: 'var(--color-retired)',
};

export function DashboardPage() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [trips, setTrips] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardKpis(), getRecentTrips()]).then(([k, t]) => {
      setKpis(k);
      setTrips(t.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const chartData = kpis ? [
    { name: 'Available', value: kpis.availableVehicles },
    { name: 'On Trip', value: kpis.activeVehicles },
    { name: 'In Shop', value: kpis.inMaintenanceVehicles },
    { name: 'Retired', value: kpis.retiredVehicles },
  ] : [];

  const barColors = [
    STATUS_COLORS.available, STATUS_COLORS.onTrip, STATUS_COLORS.inShop, STATUS_COLORS.retired,
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Fleet overview and operational KPIs</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard label="Active Vehicles" value={kpis?.activeVehicles ?? 0} color="var(--color-on-trip)" />
        <KpiCard label="Available Vehicles" value={kpis?.availableVehicles ?? 0} color="var(--color-available)" />
        <KpiCard label="Vehicles in Maintenance" value={kpis?.inMaintenanceVehicles ?? 0} color="var(--color-in-shop)" />
        <KpiCard label="Active Trips" value={kpis?.activeTrips ?? 0} color="var(--color-accent)" />
        <KpiCard label="Pending Trips" value={kpis?.pendingTrips ?? 0} color="var(--color-text-muted)" />
        <KpiCard label="Drivers on Duty" value={kpis?.driversOnDuty ?? 0} color="var(--color-dispatched)" />
        <KpiCard label="Fleet Utilization" value={`${kpis?.fleetUtilization ?? 0}%`} color="var(--color-accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Recent Trips */}
        <div className="table-container">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '14px' }}>
            Recent Trips
          </div>
          <table>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Route</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>No trips yet</td></tr>
              ) : (
                (trips as Array<{
                  tripCode: string;
                  vehicle?: { regNumber: string };
                  driver?: { name: string };
                  status: string;
                  source: string;
                  destination: string;
                }>).map(t => (
                  <tr key={t.tripCode}>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{t.tripCode}</td>
                    <td>{t.vehicle?.regNumber ?? '—'}</td>
                    <td>{t.driver?.name ?? '—'}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {t.source} → {t.destination}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vehicle Status Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title">Vehicle Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} width={70} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                labelStyle={{ color: 'var(--color-text)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_entry, idx) => (
                  <Cell key={idx} fill={barColors[idx]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: barColors[i] }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
