export type Stat = {
  label: string;
  value: string | number;
};

export default function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
