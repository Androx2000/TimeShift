import Card from './Card';

// Indicator card: a small label on top and a big value below.
// `label` can be text or an element (the Monitor passes a StateBadge).
export default function KpiCard({ label, value }) {
  return (
    <Card>
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</div>
      <p className="text-2xl sm:text-3xl font-bold font-mono mt-2">{value}</p>
    </Card>
  );
}