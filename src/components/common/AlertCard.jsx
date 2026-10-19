import { useI18n } from "../../i18n";
import { entryFor } from "../../utils/errorCatalog";
import { timeAgo } from "../../utils/time";
import { formatMoneyPiastres } from "../../utils/format";
import Badge from "./Badge";
import CatalogActions from "./CatalogActions";
import { SEV_TONE } from "./CatalogEntryView";
import { useHelp } from "./HelpPanel";

/** One alert: severity colour, plain title, one-line meaning, "How to fix" (full steps) and the catalog buttons. */
export default function AlertCard({ alert, compact = false }) {
  const { t, lang } = useI18n();
  const { open } = useHelp();
  const entry = entryFor(alert.code, lang);
  const ctx = { chargerId: alert.chargerId, sessionId: alert.sessionId };
  const where = [
    alert.chargerId && `${t("common.charger")} ${alert.chargerId}`,
    alert.sessionId && `${t("common.session")} #${alert.sessionId}`,
    alert.paymentId && `${t("common.payment")} #${alert.paymentId}`,
  ].filter(Boolean);
  const p = alert.params || {};
  return (
    <article className={`alert-card sev-${alert.severity}`}>
      <div className="alert-top">
        <Badge tone={SEV_TONE[alert.severity]}>{t(`sev.${alert.severity}`)}</Badge>
        {where.map((w) => (
          <span key={w} className="alert-where">
            {w}
          </span>
        ))}
        {alert.since ? <span className="alert-since">{t("alerts.since", { when: timeAgo(alert.since, t) })}</span> : null}
      </div>
      <h3>{entry.title}</h3>
      <p className="alert-meaning">{entry.meaning}</p>
      {p.vendorErrorCode || p.info ? (
        <p className="alert-vendor" dir="ltr">
          {t("alerts.vendor")}: {p.vendorErrorCode || "-"} {p.info ? `· ${p.info}` : ""}
        </p>
      ) : null}
      {p.driftMin ? <p className="alert-vendor">{t(p.ahead ? "alerts.driftAhead" : "alerts.driftBehind", { min: p.driftMin })}</p> : null}
      {p.amountPiastres ? <p className="alert-vendor">{formatMoneyPiastres(p.amountPiastres)}</p> : null}
      <div className="alert-actions">
        <button type="button" className="button button-primary" onClick={() => open(alert.code, ctx)}>
          {t("alerts.howToFix")}
        </button>
        {!compact ? <CatalogActions entry={entry} ctx={ctx} /> : null}
      </div>
    </article>
  );
}
