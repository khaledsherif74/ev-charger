import { useI18n } from "../../i18n";

/** Live graph of the energy delivered in the current session (points are collected while the page is open). */
export default function SessionChart({ points }) {
  const { t } = useI18n();
  if (points.length < 2) return <div className="chart-empty">{t("u.chart.waiting")}</div>;
  const W = 420;
  const H = 150;
  const pad = { l: 38, r: 10, t: 10, b: 22 };
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const maxY = Math.max(0.1, ...points.map((p) => p.kwh)) * 1.1;
  const x = (p) => pad.l + ((p.t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
  const y = (p) => H - pad.b - (p.kwh / maxY) * (H - pad.t - pad.b);
  const line = points.map((p) => `${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${pad.l},${H - pad.b} ${line} ${x(points[points.length - 1]).toFixed(1)},${H - pad.b}`;
  const last = points[points.length - 1];
  const minutes = Math.max(1, Math.round((t1 - t0) / 60000));
  return (
    <figure className="chart" aria-label={t("u.chart.title")}>
      <figcaption>{t("u.chart.title")}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" preserveAspectRatio="xMidYMid meet">
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} className="chart-axis" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} className="chart-axis" />
        <text x={pad.l - 6} y={pad.t + 8} textAnchor="end" className="chart-label">{maxY.toFixed(1)}</text>
        <text x={pad.l - 6} y={H - pad.b} textAnchor="end" className="chart-label">0</text>
        <text x={pad.l} y={H - 5} className="chart-label">{t("u.chart.start")}</text>
        <text x={W - pad.r} y={H - 5} textAnchor="end" className="chart-label">{t("u.chart.minutes", { n: minutes })}</text>
        <polygon points={area} className="chart-area" />
        <polyline points={line} className="chart-line" />
        <circle cx={x(last)} cy={y(last)} r="4" className="chart-dot" />
      </svg>
      <div className="chart-now">
        {last.kwh.toFixed(2)} kWh · {last.cost.toFixed(2)} {t("common.egp")}
      </div>
    </figure>
  );
}
