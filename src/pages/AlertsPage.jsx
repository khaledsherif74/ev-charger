import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAlerts } from "../features/alerts/alertsSlice";
import { useI18n } from "../i18n";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import AlertCard from "../components/common/AlertCard";

export default function AlertsPage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { items, status, error, newIds } = useSelector((s) => s.alerts);
  const [sev, setSev] = useState("all");
  const shown = items.filter((a) => sev === "all" || a.severity === sev);
  const counts = { all: items.length, critical: 0, warning: 0, info: 0 };
  for (const a of items) counts[a.severity] += 1;

  return (
    <>
      <PageHeader
        title={t("alerts.title")}
        description={t("alerts.sub")}
        actions={
          <button type="button" className="button button-secondary" onClick={() => dispatch(fetchAlerts())}>
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />
      <div className="chips" role="tablist">
        {["all", "critical", "warning", "info"].map((k) => (
          <button key={k} type="button" role="tab" aria-selected={sev === k} className={`chip ${sev === k ? "active" : ""}`} onClick={() => setSev(k)}>
            {k === "all" ? t("common.all") : t(`sev.${k}`)} ({counts[k]})
          </button>
        ))}
      </div>
      {status === "loading" && !items.length ? (
        <div className="full-page-center">
          <Spinner />
        </div>
      ) : null}
      {error && !items.length ? <ErrorState message={error} onRetry={() => dispatch(fetchAlerts())} /> : null}
      {shown.length ? (
        <div className="alert-list">
          {shown.map((a) => (
            <div key={a.id} className={newIds.includes(a.id) ? "alert-new" : ""}>
              <AlertCard alert={a} />
            </div>
          ))}
        </div>
      ) : status === "succeeded" ? (
        <EmptyState title={t("home.allGood")} description={t("home.allGoodHelp")} />
      ) : null}
    </>
  );
}
