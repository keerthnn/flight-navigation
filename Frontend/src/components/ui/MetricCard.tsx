import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <section className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </section>
  );
}
