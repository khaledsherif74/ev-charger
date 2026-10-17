import { PhoneCall } from "lucide-react";
import { useI18n } from "../../i18n";
import Badge from "./Badge";
import CatalogActions from "./CatalogActions";
import ReportButton from "./ReportButton";

export const SEV_TONE = {
  critical: "danger",
  warning: "warning",
  info: "neutral",
};

export default function CatalogEntryView({ entry, ctx = {}, extra }) {
  const { t } = useI18n();
  return (
    <div className="entry">
      <div className="entry-head">
        <Badge tone={SEV_TONE[entry.severity]}>
          {t(`sev.${entry.severity}`)}
        </Badge>
        <Badge tone="neutral">{t(`src.${entry.source}`)}</Badge>
      </div>
      <h3 className="entry-title">{entry.title}</h3>
      <p className="entry-meaning">{entry.meaning}</p>
      {extra}
      <h4>{t("entry.causes")}</h4>
      <ul className="entry-list">
        {entry.causes.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <h4>{t("entry.steps")}</h4>
      <ol className="entry-steps">
        {entry.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <CatalogActions entry={entry} ctx={ctx} />
      <h4>{t("entry.impact")}</h4>
      <p>{entry.customerImpact}</p>
      <div className="entry-call">
        <PhoneCall size={18} />
        <div>
          <strong>{t("entry.callWhen")}</strong>
          <p>{entry.callTechnicianWhen}</p>
          {ctx.chargerId ? <ReportButton chargerId={ctx.chargerId} /> : null}
        </div>
      </div>
    </div>
  );
}
