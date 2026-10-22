import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/http";
import { useI18n } from "../../i18n";
import { useDispatch } from "react-redux";
import { fetchSessions } from "../../features/admin/adminSlice";
import { RefreshCw, ShieldAlert, Square, Unlock, XCircle } from "lucide-react";
import { formatKwh } from "../../utils/format";
import ConfigValue from "./ConfigValue";
import Spinner from "./Spinner";
import ResultNote from "./ResultNote";
import {
  useChargerLive,
  invalidateChargerLive,
} from "../../hooks/useChargerLive";

export default function SessionControlModal({ session, onClose }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const chargerId = session.chargerId;

  const live = useChargerLive(chargerId, { online: true });
  const liveAmps = live.data?.limit?.amps ?? null;
  const liveConfig = live.data?.config || {};

  const [amps, setAmps] = useState(liveAmps ?? 16);
  const [persist, setPersist] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);

  // Keep the slider in sync with the cache while nothing is being applied.
  useEffect(() => {
    if (!busy && liveAmps != null)
      setAmps(Math.max(6, Math.min(32, Math.round(liveAmps))));
  }, [liveAmps, busy]);

  const readLimit = useCallback(() => live.reload(), [live.reload]);

  async function sendCommand(action, command, params, successText) {
    setBusy(action);
    setMsg(null);
    const started = Date.now();
    try {
      const res = await adminApi.command(chargerId, command, params);
      if (res.ok === false)
        throw new Error(res.error?.message || "Charger rejected the command");
      setMsg({
        tone: "ok",
        text: successText,
        ms: res.ms ?? Date.now() - started,
      });
      dispatch(fetchSessions({ group: "active" }));
      if (action === "stop") setTimeout(onClose, 2000);
      if (action === "limit" || action === "clear") {
        invalidateChargerLive(chargerId);
        live.reload?.();
      }
    } catch (e) {
      setMsg({ tone: "bad", text: `Error: ${e.message}` });
    } finally {
      setBusy("");
    }
  }

  function applyLimit() {
    const params = persist
      ? { limitAmps: amps, purpose: "TxDefaultProfile", connectorId: 1 }
      : {
          limitAmps: amps,
          purpose: "TxProfile",
          transactionId: session.id,
          connectorId: 1,
        };
    sendCommand(
      "limit",
      "SetCurrentLimit",
      params,
      t("lc.limitApplied", { a: amps }),
    );
  }

  const configRows = Object.entries(liveConfig)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("lc.title", { n: session.id })}
        style={{ width: "min(780px, 100%)" }}
      >
        <header className="modal-head">
          <ShieldAlert size={22} />
          <h2>{t("lc.title", { n: session.id })}</h2>
        </header>

        <div className="modal-body">
          <div className="effect">
            <strong>{t("common.customer")}</strong>
            <p>{session.userEmail}</p>
            <strong>{t("common.charger")}</strong>
            <p dir="ltr">
              {chargerId} · {formatKwh(session.energyWh)}
            </p>
          </div>

          <section style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>{t("lc.limitTitle")}</h3>
              <button
                type="button"
                className="help-link"
                onClick={readLimit}
                disabled={live.loading}
              >
                <RefreshCw size={13} className={live.loading ? "spin" : ""} />
                {t("common.refresh")}
              </button>
            </div>

            <div
              className={`limit-now limit-${liveAmps != null ? "set" : live.loading ? "loading" : "none"}`}
            >
              {liveAmps != null
                ? t("ch.limitNow", { a: liveAmps })
                : live.loading
                  ? t("common.loading")
                  : t("ch.limitNone")}
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span>
                {t("lc.currentLimit")}: <strong>{amps} A</strong>
              </span>
              <input
                type="range"
                min="6"
                max="32"
                step="1"
                value={amps}
                onChange={(e) => setAmps(Number(e.target.value))}
                disabled={!!busy}
                aria-label={t("lc.currentLimit")}
              />
            </label>

            <label className="check" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={persist}
                onChange={(e) => setPersist(e.target.checked)}
                disabled={!!busy}
              />
              {t("lc.persist")}
            </label>

            <div className="cmd-foot" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={applyLimit}
                disabled={!!busy}
              >
                {busy === "limit" ? t("lc.applying") : t("lc.applyLimit")}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  sendCommand(
                    "clear",
                    "ClearChargingProfile",
                    { connectorId: 1 },
                    t("lc.limitCleared"),
                  )
                }
                disabled={!!busy}
              >
                <XCircle size={15} />
                {t("lc.clearLimit")}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  sendCommand(
                    "unlock",
                    "UnlockConnector",
                    { connectorId: 1 },
                    t("lc.unlocked"),
                  )
                }
                disabled={!!busy}
              >
                <Unlock size={15} />
                {t("ca.unlock")}
              </button>
            </div>
          </section>

          <section style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>{t("lc.liveConfig")}</h3>
              <button
                type="button"
                className="help-link"
                onClick={readLimit}
                disabled={live.loading}
              >
                <RefreshCw size={13} className={live.loading ? "spin" : ""} />
                {t("lc.readLive")}
              </button>
            </div>

            {live.loading && !configRows.length ? (
              <div className="muted" style={{ padding: 8 }}>
                <Spinner />
              </div>
            ) : null}

            {live.error ? (
              <div className="note note-bad">{live.error.message}</div>
            ) : null}

            {configRows.length ? (
              <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8 }}>
                <ul className="mc-list">
                  {configRows.map((r) => (
                    <li key={r.key}>
                      <div className="mc-name">
                        <strong>{r.key}</strong>
                      </div>
                      <div className="mc-value">
                        <ConfigValue k={r.key} value={r.value} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {msg ? (
            <ResultNote note={msg} ctx={{ chargerId, sessionId: session.id }} />
          ) : null}
        </div>

        <footer
          className="modal-foot"
          style={{ justifyContent: "space-between" }}
        >
          <button
            className="button button-danger"
            onClick={() =>
              sendCommand(
                "stop",
                "RemoteStopTransaction",
                { transactionId: session.id },
                t("u.stopping"),
              )
            }
            disabled={!!busy}
          >
            <Square size={15} />
            {busy === "stop" ? t("u.stopping") : t("lc.stop")}
          </button>
          <button
            className="button button-secondary"
            onClick={onClose}
            disabled={!!busy}
          >
            {t("lc.close")}
          </button>
        </footer>
      </div>
    </div>
  );
}
