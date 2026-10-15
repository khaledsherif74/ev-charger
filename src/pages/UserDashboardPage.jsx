import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  Gauge,
  RefreshCw,
  Square,
  WalletCards,
  Zap,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserDashboard,
  startCharging,
  stopCharging,
} from "../features/user/userSlice";
import Badge from "../components/common/Badge";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";
import PageHeader from "../components/common/PageHeader";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import { formatDate, formatMoneyPiastres, formatKwh } from "../utils/format";

// The backend only starts a session when the cable is plugged in: connector status "Preparing".
// (This page used to require "Available", so Start was enabled exactly when the server would refuse it.)
const isReady = (charger) => charger.online && charger.status === "Preparing";

function statusTone(status, online) {
  if (!online) return "danger";
  if (status === "Faulted") return "danger";
  if (status === "Charging" || status === "Preparing") return "success";
  return "neutral";
}

function hint(charger) {
  if (!charger.online) return "Offline";
  if (charger.status === "Preparing") return "Car connected · ready to start";
  if (charger.status === "Available")
    return "Plug the cable into your car to start";
  return charger.status;
}

function SessionPanel() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.user.activeSession);
  const actionStatus = useSelector((state) => state.user.actionStatus);
  const actionError = useSelector((state) => state.user.actionError);
  const busy = actionStatus === "stopping";

  if (!session) {
    return (
      <EmptyState
        title="No active charging session"
        description="Plug in your car, then start a billed charging session below."
      />
    );
  }

  return (
    <div className="active-session-card">
      <div className="session-live-banner">
        <span className="status-dot live" />
        Charging session #{session.id} · {session.chargerId}
      </div>
      <div className="user-session-grid">
        <div>
          <span>State</span>
          <strong>{session.state}</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{formatKwh(session.energyWh)}</strong>
        </div>
        <div>
          <span>Current cost</span>
          <strong>{formatMoneyPiastres(session.costPiastres)}</strong>
        </div>
        <div>
          <span>Remaining wallet</span>
          <strong>{formatMoneyPiastres(session.remainingPiastres)}</strong>
        </div>
        <div>
          <span>Power</span>
          <strong>
            {session.powerW != null
              ? `${(session.powerW / 1000).toFixed(2)} kW`
              : "—"}
          </strong>
        </div>
        <div>
          <span>Started</span>
          <strong>{formatDate(session.startedAt)}</strong>
        </div>
      </div>
      {actionError ? (
        <div className="form-error" style={{ marginTop: 12 }}>
          {actionError}
        </div>
      ) : null}
      <div className="session-action-row">
        <div className="muted">
          Charging is billed by the backend session and wallet logic.
        </div>
        <button
          className="button button-danger"
          onClick={() => dispatch(stopCharging(session.id))}
          disabled={busy || !session.id}
        >
          {busy ? (
            <Spinner label="Stopping…" />
          ) : (
            <>
              <Square size={15} />
              Stop charging
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ChargerPicker() {
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
                  <strong>{charger.id}</strong>
                  <span>{hint(charger)}</span>
                </div>
              </div>
              <Badge tone={statusTone(charger.status, charger.online)} dot>
                {charger.online ? charger.status : "Offline"}
              </Badge>
              <button
                className="button button-primary"
                onClick={() => dispatch(startCharging(charger.id))}
                disabled={!isReady(charger) || locked}
              >
                {starting ? (
                  <Spinner label="Starting…" />
                ) : (
                  <>
                    <Zap size={14} />
                    Start
                  </>
                )}
              </button>
            </div>
          );
        })
      ) : (
        <EmptyState
          title="No chargers available"
          description="The backend has not returned any charger records yet."
        />
      )}
      {actionError ? (
        <div className="form-error" style={{ margin: "12px 14px 0" }}>
          {actionError}
        </div>
      ) : null}
    </div>
  );
}

function RecentSessions() {
  const sessions = useSelector((state) => state.user.sessions);
  return (
    <SectionCard
      title="Recent sessions"
      subtitle="Your latest charging sessions returned by the backend."
    >
      {sessions.length ? (
        <div className="table-shell table-scroll">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Charger</th>
                <th>State</th>
                <th>Energy</th>
                <th>Cost</th>
                <th>Started</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>#{session.id}</td>
                  <td className="mono">{session.chargerId}</td>
                  <td>
                    <Badge
                      tone={
                        session.state === "COMPLETED"
                          ? "success"
                          : ["FAILED", "TIMEOUT"].includes(session.state)
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {session.state}
                    </Badge>
                  </td>
                  <td>{formatKwh(session.energyWh)}</td>
                  <td>{formatMoneyPiastres(session.costPiastres)}</td>
                  <td>{formatDate(session.startedAt)}</td>
                  <td>{formatDate(session.endedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No sessions yet"
          description="Your charging history will appear here after your first session."
        />
      )}
    </SectionCard>
  );
}

export default function UserDashboardPage() {
  const dispatch = useDispatch();
  const { status, error, balancePiastres, activeSession, chargers } =
    useSelector((state) => state.user);
  const user = useSelector((state) => state.auth.user);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    dispatch(fetchUserDashboard());
    const timer = window.setInterval(
      () => dispatch(fetchUserDashboard()),
      15000,
    );
    return () => window.clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const online = useMemo(
    () => chargers.filter((item) => item.online).length,
    [chargers],
  );
  const ready = useMemo(() => chargers.filter(isReady).length, [chargers]);
  const elapsed = activeSession?.startedAt
    ? Math.max(
        0,
        Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000),
      )
    : 0;
  const elapsedText = activeSession
    ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m ${elapsed % 60}s`
    : "—";

  if (status === "loading" && !chargers.length && !user)
    return (
      <div className="full-page-center">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  if (error && status === "failed" && !chargers.length)
    return (
      <ErrorState
        message={error}
        onRetry={() => dispatch(fetchUserDashboard())}
      />
    );

  return (
    <>
      <PageHeader
        title="Your charging dashboard"
        description={`Welcome back${user?.email ? `, ${user.email}` : ""}. Start a charging session, monitor its live cost, and manage your wallet.`}
        actions={
          <button
            className="button button-secondary"
            onClick={() => dispatch(fetchUserDashboard())}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <div className="metric-grid user-metric-grid">
        <MetricCard
          label="Wallet balance"
          value={formatMoneyPiastres(balancePiastres)}
          helper="Available for charging and top-ups"
          icon={WalletCards}
          tone="success"
        />
        <MetricCard
          label="Active session"
          value={activeSession ? `#${activeSession.id}` : "None"}
          helper={
            activeSession
              ? `${activeSession.chargerId} · ${elapsedText}`
              : "No charger running"
          }
          icon={Gauge}
          tone={activeSession ? "accent" : "default"}
        />
        <MetricCard
          label="Ready to charge"
          value={ready}
          helper="Car plugged in, waiting for Start"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Connected chargers"
          value={online}
          helper={`${chargers.length} configured chargers`}
          icon={BatteryCharging}
        />
      </div>

      <div className="dashboard-grid-main">
        <SectionCard
          title="Current charging session"
          subtitle={
            activeSession
              ? "Live session data from the authenticated charging account."
              : "No active session."
          }
        >
          <SessionPanel />
        </SectionCard>
        <SectionCard
          title="Wallet at a glance"
          subtitle="Your current balance is read from the backend wallet service."
        >
          <div className="user-wallet-card">
            <div className="wallet-icon">
              <WalletCards size={20} />
            </div>
            <strong>{formatMoneyPiastres(balancePiastres)}</strong>
            <span>Current balance</span>
            <a className="button button-primary" href="/app/wallet">
              Manage wallet
            </a>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Chargers"
        subtitle="Plug your car in, then press Start. A session can only be started through the backend session endpoint."
      >
        <ChargerPicker />
      </SectionCard>

      <div style={{ height: 16 }} />
      <RecentSessions />
    </>
  );
}
