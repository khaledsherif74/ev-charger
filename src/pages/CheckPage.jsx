import { useRef, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Play, Square } from "lucide-react";
import { adminApi } from "../api/http";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { errorText } from "../utils/plain";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import ChargerSelect from "../components/common/ChargerSelect";
import EmptyState from "../components/common/EmptyState";
import TechDetails, { pretty } from "../components/common/TechDetails";
import { HelpLink } from "../components/common/HelpPanel";
import ReportButton from "../components/common/ReportButton";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = 1200;
const ICON = { ok: CircleCheck, warn: CircleAlert, bad: CircleX };

function chargerClockDiffMs(logs) {
  for (const l of logs) {
    let m;
    try {
      m = JSON.parse(l.payload);
    } catch {
      continue;
    }
    const p = Array.isArray(m) && m[0] === 2 ? m[3] : null;
    const stamp = p?.timestamp || p?.meterValue?.[0]?.timestamp;
    if (stamp && Date.now() - new Date(l.createdAt).getTime() < 60000)
      return new Date(stamp).getTime() - new Date(l.createdAt).getTime();
  }
  return null;
}

export default function CheckPage() {
  const { t } = useI18n();
  const { chargers, reload } = useOverview(0);
  const [chargerId, setChargerId] = useState("");
  const [state, setState] = useState({
    running: false,
    step: 0,
    rows: [],
    raw: [],
  });
  const stop = useRef(false);
  const total = 6;

  async function run() {
    stop.current = false;
    const raw = [];
    const rows = [];
    const set = (running, step) =>
      setState({ running, step, rows: [...rows], raw: [...raw] });
    const row = (id, st, noteKey, vars, code) =>
      rows.push({ id, state: st, noteKey, vars, code });
    const call = async (name, params) => {
      try {
        const r = await adminApi.command(chargerId, name, params);
        raw.push({
          name,
          params,
          ok: r.ok,
          answer: r.ok ? r.response : r.error,
        });
        return r;
      } catch (e) {
        raw.push({
          name,
          params,
          ok: false,
          answer: { error: e.message, code: e.code },
        });
        throw e;
      }
    };

    set(true, 1);
    let connected = false;
    try {
      const r = await call("TriggerMessage", { requestedMessage: "Heartbeat" });
      connected = r.ok && r.response?.status === "Accepted";
      row(
        "connection",
        connected ? "ok" : "warn",
        connected ? "chk.connection.ok" : "chk.connection.warn",
        {},
        connected ? null : "NoHeartbeat",
      );
    } catch (e) {
      row(
        "connection",
        "bad",
        "chk.connection.bad",
        { why: errorText(e, t) },
        "Offline",
      );
    }
    if (!connected && rows[0].state === "bad") {
      for (const id of ["freevend", "meter", "limit", "time", "errors"])
        row(id, "bad", "chk.skipped", {}, null);
      set(false, total);
      reload();
      return;
    }

    set(true, 2);
    let cfg = null;
    try {
      cfg = await adminApi.chargerConfig(chargerId);
      raw.push({
        name: "GetConfiguration",
        params: {},
        ok: true,
        answer: { keys: cfg.configurationKey.length, unknown: cfg.unknownKey },
      });
    } catch (e) {
      raw.push({
        name: "GetConfiguration",
        params: {},
        ok: false,
        answer: { error: e.message, code: e.code },
      });
    }
    const val = (k) => cfg?.configurationKey.find((c) => c.key === k)?.value;
    if (!cfg)
      row("freevend", "warn", "chk.freevend.unknown", {}, "ANSWER_Rejected");
    else if (val("FreevendEnabled") === undefined)
      row("freevend", "ok", "chk.freevend.none", {}, null);
    else if (String(val("FreevendEnabled")).toLowerCase() === "false")
      row("freevend", "ok", "chk.freevend.ok", {}, null);
    else row("freevend", "bad", "chk.freevend.bad", {}, "FREEVEND_ENABLED");
    if (stop.current) return set(false, total);

    set(true, 3);
    await sleep(PACE);
    let meterAnswer = "none";
    try {
      const r = await call("TriggerMessage", {
        requestedMessage: "MeterValues",
        connectorId: 1,
      });
      meterAnswer = r.ok ? r.response?.status : "error";
    } catch {
      meterAnswer = "error";
    }
    const interval = Number(val("MeterValueSampleInterval"));
    if (cfg && (!Number.isFinite(interval) || interval < 1))
      row("meter", "bad", "chk.meter.bad", {}, "METER_INTERVAL");
    else if (cfg && interval > 30)
      row("meter", "warn", "chk.meter.slow", { s: interval }, "METER_INTERVAL");
    else if (meterAnswer === "NotImplemented" || meterAnswer === "error")
      row("meter", "warn", "chk.meter.unknown", {}, "ANSWER_NotImplemented");
    else
      row(
        "meter",
        "ok",
        "chk.meter.ok",
        { s: Number.isFinite(interval) ? interval : "?" },
        null,
      );
    if (stop.current) return set(false, total);

    set(true, 4);
    await sleep(PACE);
    let limit = null;
    let limitKnown = false;
    try {
      const r = await call("GetCompositeSchedule", {
        connectorId: 1,
        duration: 3600,
        chargingRateUnit: "A",
      });
      if (r.ok && r.response?.status === "Accepted") {
        limitKnown = true;
        limit = Math.min(
          ...(
            r.response.chargingSchedule?.chargingSchedulePeriod || [
              { limit: Infinity },
            ]
          ).map((p) => p.limit),
        );
      } else if (r.ok && r.response?.status === "Rejected") limitKnown = true;
    } catch {}
    if (!limitKnown)
      row("limit", "warn", "chk.limit.unknown", {}, "ANSWER_NotSupported");
    else if (Number.isFinite(limit) && limit < 10)
      row("limit", "warn", "chk.limit.low", { a: limit }, "CURRENT_LIMIT_LOW");
    else
      row(
        "limit",
        "ok",
        Number.isFinite(limit) ? "chk.limit.ok" : "chk.limit.none",
        { a: limit },
        null,
      );
    if (stop.current) return set(false, total);

    set(true, 5);
    await sleep(PACE);
    let diff = null;
    try {
      await call("TriggerMessage", {
        requestedMessage: "StatusNotification",
        connectorId: 1,
      });
      await sleep(1800);
      const logs = await adminApi.logs({
        chargerId,
        direction: "IN",
        limit: 20,
      });
      diff = chargerClockDiffMs(logs.logs);
    } catch {}
    if (diff === null)
      row("time", "warn", "chk.time.unknown", {}, "WrongClock");
    else if (Math.abs(diff) > 5 * 60000)
      row(
        "time",
        "warn",
        "chk.time.bad",
        { min: Math.round(Math.abs(diff) / 60000) },
        "WrongClock",
      );
    else row("time", "ok", "chk.time.ok", {}, null);

    set(true, 6);
    let fresh = null;
    try {
      fresh = (await adminApi.overview()).chargers.find(
        (c) => c.id === chargerId,
      );
    } catch {}
    const c = fresh || chargers.find((x) => x.id === chargerId);
    const err =
      c?.errorCode && c.errorCode !== "NoError"
        ? c.errorCode
        : c?.status === "Faulted"
          ? "Faulted"
          : null;
    if (err) row("errors", "bad", "chk.errors.bad", { code: err }, err);
    else row("errors", "ok", "chk.errors.ok", {}, null);
    set(false, total);
    reload();
  }

  const worst = state.rows.some((r) => r.state === "bad")
    ? "bad"
    : state.rows.some((r) => r.state === "warn")
      ? "warn"
      : "ok";
  const done = !state.running && state.rows.length > 0;
  return (
    <>
      <PageHeader title={t("chk.title")} description={t("chk.sub")} />
      <div className="help-filters">
        <ChargerSelect
          chargers={chargers}
          value={chargerId}
          onChange={setChargerId}
        />
        {state.running ? (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => (stop.current = true)}
          >
            <Square size={15} />
            {t("chk.stop")}
          </button>
        ) : (
          <button
            type="button"
            className="button button-primary"
            onClick={run}
            disabled={!chargerId}
          >
            <Play size={15} />
            {t("chk.run")}
          </button>
        )}
      </div>
      {state.running ? (
        <div className="note note-warn">
          {t("chk.progress", { n: state.step, total })}
        </div>
      ) : null}
      {!state.rows.length && !state.running ? (
        <EmptyState title={t("chk.empty")} description={t("chk.emptyHelp")} />
      ) : null}
      {state.rows.length ? (
        <SectionCard
          title={t("chk.report")}
          subtitle={done ? t(`chk.verdict.${worst}`) : undefined}
        >
          <ul className="check-list">
            {state.rows.map((r) => {
              const Icon = ICON[r.state];
              return (
                <li key={r.id} className={`check-row st-${r.state}`}>
                  <Icon size={22} />
                  <div>
                    <strong>{t(`chk.item.${r.id}`)}</strong>
                    <p>{t(r.noteKey, r.vars)}</p>
                    {r.state !== "ok" && r.code ? (
                      <HelpLink code={r.code} ctx={{ chargerId }} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {done && worst !== "ok" ? (
            <div className="pad">
              <ReportButton chargerId={chargerId} />
            </div>
          ) : null}
          {state.raw.length ? (
            <div className="pad">
              <TechDetails>
                <pre className="log-payload">{pretty(state.raw)}</pre>
              </TechDetails>
            </div>
          ) : null}
        </SectionCard>
      ) : null}
    </>
  );
}
