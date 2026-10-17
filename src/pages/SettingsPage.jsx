import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { formatMoneyPiastres } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import Badge from "../components/common/Badge";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import { HelpLink } from "../components/common/HelpPanel";

export default function SettingsPage() {
  const { t } = useI18n();
  const { overview, status, error, reload } = useOverview(0);
  if (!overview && status === "loading")
    return (
      <div className="full-page-center">
        <Spinner />
      </div>
    );
  if (!overview) return <ErrorState message={error} onRetry={reload} />;
  const c = overview.config;
  const rows = [
    ["price", formatMoneyPiastres(c.pricePerKwhPiastres), t("set.priceUnit")],
    ["minStart", formatMoneyPiastres(c.minStartBalancePiastres)],
    ["minTopup", formatMoneyPiastres(c.minTopupPiastres)],
    ["maxTopup", formatMoneyPiastres(c.maxTopupPiastres)],
    ["margin", `${c.safetyMarginSec} ${t("set.sec")}`],
    ["meter", `${c.meterIntervalSec} ${t("set.sec")}`],
    ["offlineGrace", `${c.offlineGraceMin} ${t("set.min")}`],
    ["idle", `${c.suspendedIdleMin} ${t("set.min")}`],
  ];
  return (
    <>
      <PageHeader title={t("set.title")} description={t("set.sub")} />
      <SectionCard title={t("set.money")}>
        <div className="guide-list">
          {rows.map(([k, v, unit]) => (
            <div key={k} className="guide-row">
              <div>
                <strong>{t(`set.${k}`)}</strong>
                <p>{t(`set.${k}Help`)}</p>
              </div>
              <code>
                {v}
                {unit ? ` ${unit}` : ""}
              </code>
            </div>
          ))}
        </div>
      </SectionCard>
      <div style={{ height: 16 }} />
      <SectionCard title={t("set.system")}>
        <div className="guide-list">
          <div className="guide-row">
            <div>
              <strong>{t("set.paymob")}</strong>
              <p>{t("set.paymobHelp")}</p>
            </div>
            <Badge tone={c.paymobConfigured ? "success" : "danger"}>
              {c.paymobConfigured
                ? t("set.configured")
                : t("set.notConfigured")}
            </Badge>
            {!c.paymobConfigured ? (
              <HelpLink code="PAYMOB_KEYS_MISSING" />
            ) : null}
          </div>
          <div className="guide-row">
            <div>
              <strong>{t("set.admin")}</strong>
              <p>{t("set.adminHelp")}</p>
            </div>
            <Badge tone={c.adminConfigured ? "success" : "danger"}>
              {c.adminConfigured ? t("set.configured") : t("set.notConfigured")}
            </Badge>
          </div>
          <div className="guide-row">
            <div>
              <strong>{t("set.url")}</strong>
              <p>{t("set.urlHelp")}</p>
            </div>
            <code dir="ltr">{c.publicUrl}</code>
          </div>
        </div>
        <div className="note note-warn pad">{t("set.change")}</div>
      </SectionCard>
    </>
  );
}
