import './StatsCard.css';

export default function StatsCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <div
      className="stats-card animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="stats-card-icon" style={{ background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div className="stats-card-info">
        <span className="stats-card-value">{value}</span>
        <span className="stats-card-label">{label}</span>
      </div>
      <div className="stats-card-glow" style={{ background: color }} />
    </div>
  );
}
