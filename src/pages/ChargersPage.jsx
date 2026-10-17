import { useCallback, useEffect, useRef, useState } from "react";
import { Cable } from "lucide-react";
import { useDispatch } from "react-redux";
import { adminApi } from "../api/http";
import { fetchOverview } from "../features/admin/adminSlice";
import { fetchAlerts } from "../features/alerts/alertsSlice";
import { useI18n } from "../i18n";
import { explainResult } from "../utils/answers";
import {
  errorCatalogCode,
  errorText,
  plainStatus,
  statusCatalogCode,
} from "../utils/plain";
import { timeAgo } from "../utils/time";
import useOverview from "../hooks/useOverview";
import Badge from "../components/common/Badge";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import { ActionButton } from "../components/common/CatalogActions";
import { useConfirm } from "../components/common/ConfirmDialog";
import { HelpLink } from "../components/common/HelpPanel";
import ReportButton from "../components/common/ReportButton";
import ResultNote from "../components/common/ResultNote";
import MainConfigCard from "../components/common/MainConfigCard";

function ChargerCard({ charger }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { confirm, dialog } = useConfirm();
  const [amps, setAmps] = useState(16);
  const [touched, setTouched] = useState(false);
  const [limit, setLimit] = useState({ state: "idle", amps: null });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const st = plainStatus(charger, t);
  const session = charger.activeSession;
  const disabled = charger.status === "Unavailable";
  const ctx = { chargerId: charger.id, sessionId: session?.id };
  const hasError = charger.errorCode && charger.errorCode !== "NoError";
  const locked = !charger.online || busy;

  const readLimit = useCallback(async () => {
    setLimit((l) => ({ ...l, state: "loading" }));
    try {
      const r = await adminApi.command(charger.id, "GetCompositeSchedule", {
        connectorId: 1,
        duration: 3600,
        chargingRateUnit: "A",
      });
      const periods =
        r.response?.chargingSchedule?.chargingSchedulePeriod || [];
      if (r.ok && r.response?.status === "Accepted" && periods.length) {
        const a = Math.min(...periods.map((p) => p.limit));
        setLimit({ state: "set", amps: a });
        setAmps((cur) =>
          touchedRef.current ? cur : Math.min(32, Math.max(6, Math.round(a))),
        );
      } else if (r.ok && r.response?.status === "Rejected")
        setLimit({ state: "none", amps: null });
      else setLimit({ state: "unknown", amps: null });
    } catch {
      setLimit({ state: "unknown", amps: null });
    }
  }, [charger.id]);
  const touchedRef = useRef(false);
  touchedRef.current = touched;
  useEffect(() => {
    if (charger.online) readLimit();
  }, [charger.id, charger.online]);

  async function applyLimit() {
    const ok = await confirm({
      title: t("act.power"),
      body: t("act.powerConfirm", { id: charger.id, amps }),
      chargerEffect: t("fx.setLimit", { amps }),
      moneyEffect: t("money.none"),
      confirmLabel: t("act.apply"),
    });
    if (!ok) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await adminApi.command(charger.id, "SetCurrentLimit", {
        limitAmps: amps,
      });
      const ex = explainResult(r);
      setNote({ tone: ex.tone, text: t(ex.textKey), code: ex.code, ms: r.ms });
    } catch (e) {
      setNote({
        tone: "bad",
        text: errorText(e, t),
        code: errorCatalogCode(e),
      });
    } finally {
      setBusy(false);
      dispatch(fetchOverview());
      dispatch(fetchAlerts());
      setTouched(false);
      setTimeout(readLimit, 1500);
    }
  }

  return (
    <article className="charger-card">
      <header className="charger-card-head">
        <div className="charger-icon">
          <Cable size={18} />
        </div>
        <div>
          <strong dir="ltr">{charger.id}</strong>
          <span>
            {t("ch.contact", { when: timeAgo(charger.lastHeartbeat, t) })}
          </span>
        </div>
        <Badge tone={st.tone} dot>
          {st.label}
        </Badge>
      </header>

      <p className="charger-help">{st.help}</p>
      <HelpLink code={statusCatalogCode(charger)} ctx={ctx} />
      {hasError ? (
        <div className="note note-bad">
          <strong>{t("ch.error")}</strong>
          <div dir="ltr">
            {charger.errorCode}
            {charger.vendorErrorCode
              ? ` · ${t("alerts.vendor")}: ${charger.vendorErrorCode}`
              : ""}
            {charger.errorInfo ? ` · ${charger.errorInfo}` : ""}
          </div>
        </div>
      ) : null}
      <div className="charger-session">
        {session ? t("ch.session", { n: session.id }) : t("ch.noSession")}
      </div>

      <div className="charger-actions">
        {session ? (
          <ActionButton
            id="stopSession"
            ctx={ctx}
            className="button button-danger"
          />
        ) : null}
        <ActionButton id="restart" ctx={ctx} />
        <ActionButton id={disabled ? "enable" : "disable"} ctx={ctx} />
        <ReportButton chargerId={charger.id} />
      </div>

      <div className="power-box">
        <div className="power-head">
          <strong>{t("act.power")}</strong>
          <span className="power-value">{amps} A</span>
        </div>
        <div className={`limit-now limit-${limit.state}`}>
          {limit.state === "set"
            ? t("ch.limitNow", { a: limit.amps })
            : limit.state === "none"
              ? t("ch.limitNone")
              : limit.state === "loading"
                ? t("common.loading")
                : limit.state === "unknown"
                  ? t("ch.limitUnknown")
                  : ""}
          {charger.online && limit.state !== "loading" ? (
            <button type="button" className="help-link" onClick={readLimit}>
              {t("common.refresh")}
            </button>
          ) : null}
        </div>
        <input
          type="range"
          min="6"
          max="32"
          step="1"
          value={amps}
          onChange={(e) => {
            setTouched(true);
            setAmps(Number(e.target.value));
          }}
          disabled={locked}
          aria-label={t("act.power")}
        />
        <p>{t("act.powerHelp")}</p>
        <button
          type="button"
          className="button button-secondary"
          disabled={locked}
          onClick={applyLimit}
        >
          {t("act.apply")}
        </button>
      </div>

      <ResultNote note={note} ctx={ctx} />
      {dialog}
    </article>
  );
}

export default function ChargersPage() {
  const { t } = useI18n();
  const { overview, chargers, status, error, reload } = useOverview();

  if (!overview && status === "loading")
    return (
      <div className="full-page-center">
        <Spinner />
      </div>
    );
  if (!overview && error)
    return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title={t("ch.title")} description={t("ch.sub")} />
      {chargers.length ? (
        <div className="charger-cards">
          {chargers.map((c) => (
            <div key={c.id} className="charger-pair">
              <ChargerCard charger={c} />
              <MainConfigCard charger={c} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t("ch.none")} />
      )}
    </>
  );
}
