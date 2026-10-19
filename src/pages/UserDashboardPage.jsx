import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, CheckCircle2, Gauge, RefreshCw, Square, WalletCards, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserDashboard, startCharging, stopCharging } from "../features/user/userSlice";
import { useI18n } from "../i18n";
import { chargerHint, whyKey } from "../utils/customer";
import { statusWord } from "../utils/plain";
import { formatDate, formatKwh, formatMoneyPiastres } from "../utils/format";
import Badge from "../components/common/Badge";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";
import PageHeader from "../components/common/PageHeader";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import SessionChart from "../components/common/SessionChart";

// A car can only be started when it is plugged in (connector status "Preparing").
const isReady = (charger) => charger.online && charger.status === "Preparing";

function statusTone(status, online) {
  if (!online || status === "Faulted") return "danger";
  if (status === "Charging" || status === "Preparing") return "success";
  return "neutral";
}

function SessionPanel({ points }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const session = useSelector((state) => state.user.activeSession);
  const actionStatus = useSelector((state) => state.user.actionStatus);
  const actionError = useSelector((state) => state.user.actionError);
  const busy = actionStatus === "stopping";

  if (!session) return <EmptyState title={t("u.session.none")} description={t("u.session.noneHelp")} />;

  return (
    <div className="active-session-card">
      <div className="session-live-banner">
        <span className="status-dot live" />
        {t("u.session.banner", { n: session.id, charger: session.chargerId })}
      </div>
      <div className="user-session-grid">
        <div>
          <span>{t("common.status")}</span>
          <strong>{t(`ss.${session.state}`)}</strong>
        </div>
        <div>
          <span>{t("u.energy")}</span>
          <strong>{formatKwh(session.energyWh)}</strong>
        </div>
        <div>
          <span>{t("u.costSoFar")}</span>
          <strong>{formatMoneyPiastres(session.costPiastres)}</strong>
        </div>
        <div>
          <span>{t("u.moneyLeft")}</span>
          <strong>{formatMoneyPiastres(session.remainingPiastres)}</strong>
        </div>
        <div>
          <span>{t("u.power")}</span>
          <strong>{session.powerW != null ? `${(session.powerW / 1000).toFixed(2)} kW` : "—"}</strong>
        </div>
        <div>
          <span>{t("u.started")}</span>
          <strong>{formatDate(session.startedAt)}</strong>
        </div>
      </div>
      <SessionChart points={points} />
      {actionError ? <div className="form-error" style={{ marginTop: 12 }}>{actionError}</div> : null}
      <div className="session-action-row">
        <div className="muted">{t("u.session.payNote", { price: formatMoneyPiastres(session.pricePerKwhPiastres) })}</div>
        <button className="button button-danger" onClick={() => dispatch(stopCharging(session.id))} disabled={busy || !session.id}>
          {busy ? (
            <Spinner label={t("u.stopping")} />
          ) : (
            <>
              <Square size={15} />
              {t("u.stop")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ChargerPicker() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const chargers = useSelector((state) => state.user.chargers);
  const activeSession = useSelector((state) => state.user.activeSession);
  const actionStatus = useSelector((state) => state.user.actionStatus);
  const actionError = useSelector((state) => state.user.actionError);
  const starting = actionStatus === "starting";

  return (
    <div className="user-charger-list">
      {chargers.length ? (
        chargers.map((charger) => {
          const locked = Boolean(activeSession) || starting;
          return (
            <div key={charger.id} className="user-charger-row">
              <div className="charger-primary">
                <div className="charger-icon">
                  <BatteryCharging size={17} />
                </div>
                <div>
                  <strong dir="ltr">{charger.id}</strong>
                  <span>{chargerHint(charger, t)}</span>
                </div>
              </div>
              <Badge tone={statusTone(charger.status, charger.online)} dot>
                {charger.online ? statusWord(charger.status, t) : t("status.offline")}
              </Badge>
              <button className="button button-primary" onClick={() => dispatch(startCharging(charger.id))} disabled={!isReady(charger) || locked}>
                {starting ? (
                  <Spinner label={t("u.starting")} />
                ) : (
                  <>
                    <Zap size={14} />
                    {t("u.start")}
                  </>
                )}
              </button>
            </div>
          );
        })
      ) : (
        <EmptyState title={t("u.chargers.none")} description={t("u.chargers.noneHelp")} />
      )}
      {actionError ? <div className="form-error" style={{ margin: "12px 14px 0" }}>{actionError}</div> : null}
    </div>
  );
}

function RecentSessions() {
  const { t } = useI18n();
  const sessions = useSelector((state) => state.user.sessions);
  const tone = (s) => (s === "COMPLETED" ? "success" : ["FAILED", "TIMEOUT"].includes(s) ? "danger" : "neutral");
  return (
    <SectionCard title={t("u.recent")} subtitle={t("u.recentHelp")}>
      {sessions.length ? (
        <div className="table-shell table-scroll">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>{t("u.col.session")}</th>
                <th>{t("common.charger")}</th>
                <th>{t("common.status")}</th>
                <th>{t("u.energy")}</th>
                <th>{t("u.cost")}</th>
                <th>{t("u.started")}</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={t("u.sessions.none")} description={t("u.sessions.noneHelp")} />
      )}
    </SectionCard>
  );
}

export default function UserDashboardPage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { status, error, balancePiastres, activeSession, chargers } = useSelector((state) => state.user);
  const user = useSelector((state) => state.auth.user);
  const [now, setNow] = useState(Date.now());
  const [points, setPoints] = useState([]);

  useEffect(() => {
    dispatch(fetchUserDashboard());
    const timer = window.setInterval(() => dispatch(fetchUserDashboard()), 15000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // collect the live graph while the page is open (a new session starts a new graph)
  useEffect(() => {
    if (!activeSession) {
      setPoints([]);
      return;
    }
    setPoints((prev) => {
      const base = prev.length && prev[0].sid !== activeSession.id ? [] : prev;
      const pt = { sid: activeSession.id, t: Date.now(), kwh: activeSession.energyWh / 1000, cost: activeSession.costPiastres / 100 };
      const last = base[base.length - 1];
      if (last && last.kwh === pt.kwh) return base;
      return [...base.slice(-119), pt];
    });
  }, [activeSession?.id, activeSession?.energyWh, activeSession?.costPiastres]);

  const online = useMemo(() => chargers.filter((item) => item.online).length, [chargers]);
  const ready = useMemo(() => chargers.filter(isReady).length, [chargers]);
  const elapsed = activeSession?.startedAt ? Math.max(0, Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000)) : 0;
  const elapsedText = activeSession ? t("time.hm", { h: Math.floor(elapsed / 3600), m: Math.floor((elapsed % 3600) / 60) }) : "—";

  if (status === "loading" && !chargers.length && !user)
    return (
      <div className="full-page-center">
        <Spinner />
      </div>
    );
  if (error && status === "failed" && !chargers.length) return <ErrorState message={error} onRetry={() => dispatch(fetchUserDashboard())} />;

  return (
    <>
      <PageHeader
        title={t("u.dash.title")}
        description={t("u.dash.sub")}
        actions={
          <button className="button button-secondary" onClick={() => dispatch(fetchUserDashboard())}>
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />

      <div className="metric-grid user-metric-grid">
        <MetricCard label={t("u.balance")} value={formatMoneyPiastres(balancePiastres)} helper={t("u.balanceHelp")} icon={WalletCards} tone="success" />
        <MetricCard label={t("u.nowCharging")} value={activeSession ? `#${activeSession.id}` : t("u.none")} helper={activeSession ? `${activeSession.chargerId} · ${elapsedText}` : t("u.notCharging")} icon={Gauge} tone={activeSession ? "accent" : "default"} />
        <MetricCard label={t("u.ready")} value={ready} helper={t("u.readyHelp")} icon={CheckCircle2} tone="success" />
        <MetricCard label={t("u.available")} value={`${online} / ${chargers.length}`} helper={t("u.availableHelp")} icon={BatteryCharging} />
      </div>

      <div className="dashboard-grid-main">
        <SectionCard title={t("u.session.title")} subtitle={activeSession ? t("u.session.live") : t("u.session.none")}>
          <SessionPanel points={points} />
        </SectionCard>
        <SectionCard title={t("u.walletCard")} subtitle={t("u.walletCardHelp")}>
          <div className="user-wallet-card">
            <div className="wallet-icon">
              <WalletCards size={20} />
            </div>
            <strong>{formatMoneyPiastres(balancePiastres)}</strong>
            <span>{t("u.balance")}</span>
            <a className="button button-primary" href="/app/wallet">
              {t("u.addMoney")}
            </a>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("u.chargers")} subtitle={t("u.chargersHelp")}>
        <ChargerPicker />
      </SectionCard>

      <div style={{ height: 16 }} />
      <RecentSessions />
    </>
  );
}
