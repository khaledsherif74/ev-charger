import { RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserDashboard } from "../features/user/userSlice";
import { useI18n } from "../i18n";
import { whyKey } from "../utils/customer";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import { formatDate, formatKwh, formatMoneyPiastres } from "../utils/format";

export default function UserSessionsPage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const sessions = useSelector((state) => state.user.sessions);
  const tone = (s) => (s === "COMPLETED" ? "success" : ["FAILED", "TIMEOUT"].includes(s) ? "danger" : "neutral");
  return (
    <>
      <PageHeader
        title={t("u.sessions.title")}
        description={t("u.sessions.sub")}
        actions={
          <button className="button button-secondary" onClick={() => dispatch(fetchUserDashboard())}>
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />
      <SectionCard title={t("u.sessions.history")} subtitle={t("u.sessions.historyHelp")}>
        {sessions.length ? (
          <div className="table-shell table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("u.col.session")}</th>
                  <th>{t("common.charger")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("u.energy")}</th>
                  <th>{t("u.cost")}</th>
                  <th>{t("u.started")}</th>
                  <th>{t("u.ended")}</th>
                  <th>{t("u.why")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td dir="ltr">#{s.id}</td>
                    <td dir="ltr">{s.chargerId}</td>
                    <td><Badge tone={tone(s.state)}>{t(`ss.${s.state}`)}</Badge></td>
                    <td>{formatKwh(s.energyWh)}</td>
                    <td>{formatMoneyPiastres(s.costPiastres)}</td>
                    <td>{formatDate(s.startedAt)}</td>
                    <td>{formatDate(s.endedAt)}</td>
                    <td>{["COMPLETED", "FAILED", "TIMEOUT"].includes(s.state) ? t(whyKey(s.stopReason, s.state)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("u.sessions.none")} description={t("u.sessions.noneHelp")} />
        )}
      </SectionCard>
    </>
  );
}
