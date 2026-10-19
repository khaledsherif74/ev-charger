import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { adminApi } from "../api/http";
import usePaged from "../hooks/usePaged";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { entryFor, hasEntry } from "../utils/errorCatalog";
import { durationText } from "../utils/time";
import { formatDate, formatDay, formatKwh, formatMoneyPiastres, sessionTone } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import TechDetails from "../components/common/TechDetails";
import SettleDialog from "../components/common/SettleDialog";
import { HelpLink } from "../components/common/HelpPanel";
import { fetchAlerts } from "../features/alerts/alertsSlice";
import { useDispatch } from "react-redux";

const GROUPS = ["all", "active", "done", "failed", "review"];
const STATE_HELP = { TIMEOUT: "SESSION_TIMEOUT", FAILED: "SESSION_FAILED", OFFLINE_CHARGING: "SESSION_OFFLINE_CHARGING", UNRESOLVED: "SESSION_UNRESOLVED" };

const startOfDay = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
const endOfDay = (d) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined);

export default function SessionsPage() {
  const { t, lang } = useI18n();
  const dispatch = useDispatch();
  const { overview } = useOverview(0);
  const [group, setGroup] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [settle, setSettle] = useState(null);

  const list = usePaged(
    async (before) => {
      const r = await adminApi.sessions({ group: group === "all" ? undefined : group, from: startOfDay(from), to: endOfDay(to), before: before || undefined });
      return { items: r.sessions, nextBefore: r.nextBefore };
    },
    [group, from, to],
  );

  const reasonLabel = (reason) => (reason ? entryFor(`STOP_${reason}`, lang).title : "—");

  return (
    <>
      <PageHeader
        title={t("ses.title")}
        description={t("ses.sub")}
        actions={
          <button type="button" className="button button-secondary" onClick={list.reload} disabled={list.loading}>
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />
      <SectionCard
        title={t("ses.list")}
        actions={
          <div className="filter-group">
            <label className="filter-select">
              <span>{t("common.from")}</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="filter-select">
              <span>{t("common.to")}</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        }
      >
        <div className="chips pad">
          {GROUPS.map((g) => (
            <button key={g} type="button" className={`chip ${group === g ? "active" : ""}`} onClick={() => setGroup(g)}>
              {t(`ses.group.${g}`)}
            </button>
          ))}
        </div>
        {from || to ? <div className="hint pad">{t("ses.range", { from: from ? formatDay(from) : "…", to: to ? formatDay(to) : "…" })}</div> : null}
        {list.loading && !list.items.length ? (
          <div className="loading-block">
            <Spinner />
          </div>
        ) : null}
        {list.error && !list.items.length ? <ErrorState message={list.error.message} onRetry={list.reload} /> : null}
        {list.items.length ? (
          <>
            <div className="table-shell table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("common.customer")}</th>
                    <th>{t("common.charger")}</th>
                    <th>{t("common.status")}</th>
                    <th>kWh</th>
                    <th>EGP</th>
                    <th>{t("ses.started")}</th>
                    <th>{t("ses.duration")}</th>
                    <th>{t("ses.endedBy")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((s) => (
                    <tr key={s.id} className={s.state === "UNRESOLVED" ? "row-review" : ""}>
                      <td dir="ltr">#{s.id}</td>
                      <td dir="ltr">{s.userEmail}</td>
                      <td dir="ltr">{s.chargerId}</td>
                      <td>
                        <Badge tone={sessionTone(s.state)}>{s.state === "UNRESOLVED" ? t("ses.review") : t(`ss.${s.state}`)}</Badge>
                        <HelpLink code={STATE_HELP[s.state]} ctx={{ chargerId: s.chargerId, sessionId: s.id }} />
                      </td>
                      <td>{formatKwh(s.energyWh)}</td>
                      <td>{formatMoneyPiastres(s.costPiastres)}</td>
                      <td>{formatDate(s.startedAt || s.createdAt)}</td>
                      <td>{durationText(s.startedAt, s.endedAt, t)}</td>
                      <td>
                        {reasonLabel(s.stopReason)}
                        {s.stopReason && hasEntry(`STOP_${s.stopReason}`) ? <HelpLink code={`STOP_${s.stopReason}`} ctx={{ chargerId: s.chargerId, sessionId: s.id }} /> : null}
                      </td>
                      <td>
                        {s.state === "UNRESOLVED" ? (
                          <button type="button" className="button button-primary" onClick={() => setSettle(s)}>
                            {t("ses.settle")}
                          </button>
                        ) : null}
                        <TechDetails>
                          <div className="mono">
                            {t("ses.meterStart")}: {s.meterStartWh ?? "—"} Wh
                            <br />
                            {t("ses.meterStop")}: {s.meterStopWh ?? "—"} Wh
                            <br />
                            {t("ses.reasonRaw")}: {s.stopReason || "—"}
                          </div>
                        </TechDetails>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.next ? (
              <button type="button" className="button button-secondary load-more" onClick={list.loadMore} disabled={list.loadingMore}>
                {list.loadingMore ? <Spinner /> : t("common.loadMore")}
              </button>
            ) : null}
          </>
        ) : !list.loading && !list.error ? (
          <EmptyState title={t("ses.none")} />
        ) : null}
      </SectionCard>
      {settle ? (
        <SettleDialog
          session={settle}
          pricePerKwhPiastres={overview?.config?.pricePerKwhPiastres}
          onClose={() => setSettle(null)}
          onDone={() => {
            setSettle(null);
            list.reload();
            dispatch(fetchAlerts());
          }}
        />
      ) : null}
    </>
  );
}
