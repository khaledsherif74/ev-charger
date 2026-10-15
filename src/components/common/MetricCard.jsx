export default function MetricCard({ label, value, helper, icon: Icon, tone = 'default' }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        {Icon ? (
          <span className="metric-icon">
            <Icon size={17} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
      <div className="metric-value">{value}</div>
      {helper ? <div className="metric-helper">{helper}</div> : null}
    </article>
  );
}
