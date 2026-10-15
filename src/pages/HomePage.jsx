import { Link } from "react-router-dom";
import { Banknote, Cable, CheckCircle2, RefreshCw, TriangleAlert, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { adminApi } from "../api/http";
import { fetchAlerts, selectAlertCount } from "../features/alerts/alertsSlice";
import useFetch from "../hooks/useFetch";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { plainStatus, statusCatalogCode } from "../utils/plain";
import { formatKwh, formatMoneyPiastres } from "../utils/format";
import Badge from "../components/common/Badge";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";
import PageHeader from "../components/common/PageHeader";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import AlertCard from "../components/common/AlertCard";
import { HelpLink } from "../components/common/HelpPanel";

export default function HomePage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { overview, chargers, status, error, reload } = useOverview();
  const stats = useFetch(() => adminApi.stats(), [], { interval: 15000 });
  const alerts = useSelector((s) => s.alerts.items);
  const count = useSelector(selectAlertCount);

  if (!overview && status === "loading")
    return (
      <div className="full-page-center">
        <Spinner />
      </div>
    );
  if (!overview && error) return <ErrorState message={error} onRetry={reload} />;

  const s = stats.data;
  const top = alerts.filter((a) => a.severity !== "info").slice(0, 4);
  return (
    <>
      <PageHeader
        title={t("home.title")}
        description={t("home.sub")}
        actions={
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              reload();
              stats.reload();
              dispatch(fetchAlerts());
            }}
          >
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />

      <div className="metric-grid metric-grid-4">
        <MetricCard label={t("home.todayEnergy")} value={s ? formatKwh(s.todayEnergyWh) : "—"} helper={t("home.todayHelp")} icon={Zap} tone="accent" />
        <MetricCard label={t("home.todayIncome")} value={s ? formatMoneyPiastres(s.todayIncomePiastres) : "—"} helper={t("home.todayHelp")} icon={Banknote} tone="success" />
        <MetricCard label={t("home.charging")} value={s ? s.activeSessions : "—"} helper={t("home.chargingHelp")} icon={Zap} />
        <MetricCard
          label={t("home.online")}
          value={s ? `${s.onlineChargers} / ${s.totalChargers}` : "—"}
          helper={t("home.onlineHelp", { n: s?.onlineChargers ?? 0, total: s?.totalChargers ?? 0 })}
          icon={Cable}
          tone={s && s.onlineChargers === s.totalChargers && s.totalChargers ? "success" : "danger"}
        />
      </div>

      <SectionCard
        title={t("home.attentionTitle")}
        subtitle={count ? t("home.attentionCount", { n: count }) : undefined}
        actions={
          <Link className="button button-secondary" to="/admin/alerts">
            {t("home.allAlerts")}
          </Link>
        }
      >
        {top.length ? (
          <div className="alert-list">
            {top.map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
        ) : (
          <div className="all-good">
            <CheckCircle2 size={26} />
            <strong>{t("home.allGood")}</strong>
            <span>{t("home.allGoodHelp")}</span>
          </div>
        )}
      </SectionCard>

      <div style={{ height: 16 }} />
      <SectionCard
        title={t("home.myChargers")}
        actions={
          <Link className="button button-primary" to="/admin/chargers">
            {t("home.openChargers")}
          </Link>
        }
      >
        <div className="mini-chargers">
          {chargers.map((c) => {
            const st = plainStatus(c, t);
            return (
              <div key={c.id} className="mini-charger">
                <strong dir="ltr">{c.id}</strong>
                <span className="mini-right">
                  <Badge tone={st.tone} dot>
                    {st.label}
                  </Badge>
                  <HelpLink code={statusCatalogCode(c)} ctx={{ chargerId: c.id }} />
                </span>
              </div>
            );
          })}
          {!chargers.length ? (
            <div className="empty-state">
              <TriangleAlert size={20} />
              <p>{t("ch.none")}</p>
              <Link className="button button-primary" to="/admin/add-charger">
                {t("nav.addCharger")}
              </Link>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </>
  );
}
