interface KpiCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function KpiCard({ label, value, color = 'var(--color-accent)' }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
