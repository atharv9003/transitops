import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { getAnalyticsReport } from '../api/analytics';

interface VehicleReport {
  vehicleId: number;
  regNumber: string;
  name: string;
  totalRevenue: number;
  operationalCost: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  fuelEfficiency: number;
  roi: number;
  completedTrips: number;
}

interface MonthlyRevenue { month: string; revenue: number; }

interface Report {
  kpis: { fleetUtilization: number; totalVehicles: number; activeTrips: number };
  avgFuelEfficiency: number;
  totalOperationalCost: number;
  monthlyRevenue: MonthlyRevenue[];
  topCostliestVehicles: VehicleReport[];
  vehicleReports: VehicleReport[];
}

export function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalyticsReport()
      .then(setReport)
      .catch(() => setError('Access denied or failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state" style={{ marginTop: '80px' }}><p>Loading analytics…</p></div>;
  if (error) return <div className="form-error" style={{ margin: '24px' }}><span>⚠</span> {error}</div>;
  if (!report) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <div className="page-subtitle">Vehicle performance, costs, and revenue analytics</div>
        </div>
        <a href="/api/analytics/export/csv" download className="btn btn-secondary">⬇ Export CSV</a>
      </div>

      {/* Top KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--color-accent)' } as React.CSSProperties}>
          <div className="kpi-label">Fleet Utilization</div>
          <div className="kpi-value">{report.kpis.fleetUtilization}%</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--color-available)' } as React.CSSProperties}>
          <div className="kpi-label">Avg Fuel Efficiency</div>
          <div className="kpi-value">{report.avgFuelEfficiency} <span style={{ fontSize: '14px', fontWeight: 400 }}>km/L</span></div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--color-retired)' } as React.CSSProperties}>
          <div className="kpi-label">Total Op. Cost</div>
          <div className="kpi-value">₹{(report.totalOperationalCost / 1000).toFixed(1)}k</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Monthly Revenue */}
        <div className="card">
          <div className="card-title">Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={report.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={{ fill: 'var(--color-accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="card">
          <div className="card-title">Top Operational Costs</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={report.topCostliestVehicles} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="regNumber" type="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} width={60} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Op. Cost']}
              />
              <Bar dataKey="operationalCost" radius={[0, 4, 4, 0]}>
                {report.topCostliestVehicles.map((_, i) => (
                  <Cell key={i} fill={`hsl(${220 + i * 20}, 80%, 60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Vehicle Table */}
      <div className="table-container">
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '14px' }}>
          Vehicle Performance Report
        </div>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Trips</th>
              <th>Revenue</th>
              <th>Fuel Cost</th>
              <th>Maint. Cost</th>
              <th>Op. Cost</th>
              <th>Fuel Eff.</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {report.vehicleReports.map(v => (
              <tr key={v.vehicleId}>
                <td>
                  <div style={{ fontWeight: 600 }}>{v.regNumber}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{v.name}</div>
                </td>
                <td>{v.completedTrips}</td>
                <td style={{ color: 'var(--color-available)' }}>₹{v.totalRevenue.toLocaleString()}</td>
                <td>₹{v.totalFuelCost.toLocaleString()}</td>
                <td>₹{v.totalMaintenanceCost.toLocaleString()}</td>
                <td style={{ color: v.operationalCost > v.totalRevenue ? 'var(--color-retired)' : 'var(--color-text)' }}>
                  ₹{v.operationalCost.toLocaleString()}
                </td>
                <td>{v.fuelEfficiency > 0 ? `${v.fuelEfficiency} km/L` : '—'}</td>
                <td style={{ color: v.roi >= 0 ? 'var(--color-available)' : 'var(--color-retired)', fontWeight: 600 }}>
                  {v.roi.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
