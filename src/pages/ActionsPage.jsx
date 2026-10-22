import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Send, ShieldAlert } from "lucide-react";
import { adminApi } from "../api/http";
import useOverview from "../hooks/useOverview";
import { useChargerLive, invalidateChargerLive } from "../hooks/useChargerLive";
import { useI18n } from "../i18n";
import {
  COMMAND_CARDS,
  GOALS,
  buildParams,
  initialForm,
} from "../utils/commandCards";
import { explainResult } from "../utils/answers";
import { errorCatalogCode, errorText } from "../utils/plain";
import { formatDate } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import ChargerSelect from "../components/common/ChargerSelect";
import TechDetails, { pretty } from "../components/common/TechDetails";
import ResultNote from "../components/common/ResultNote";
import { useConfirm } from "../components/common/ConfirmDialog";
import ConfigChangeFields from "../components/common/ConfigChangeFields";

const RISK_TONE = { safe: "success", careful: "warning", dangerous: "danger" };

// Methods that can change charger state — after them the cache is invalidated
// so the next open re-reads.
const MUTATING_METHODS = new Set([
  "ChangeConfiguration",
  "SetChargingProfile",
  "ClearChargingProfile",
  "SendLocalList",
  "ClearCache",
  "Reset",
  "UpdateFirmware",
  "ChangeAvailability",
]);

// Cards where connectorId refers to the plug currently in use.
const PER_PLUG_CARDS = new Set([
  "RemoteStartTransaction",
  "UnlockConnector",
  "SetCurrentLimit",
  "GetCompositeSchedule",
  "SetChargingProfile",
  "TriggerMessage",
  "ReserveNow",
]);

function summarizeByMethod(method, result, t) {
  if (!result.ok) return null;
  const r = result.response || {};
  if (method === "GetCompositeSchedule" && r.status === "Accepted") {
    const per = r.chargingSchedule?.chargingSchedulePeriod || [];
    const unit = r.chargingSchedule?.chargingRateUnit || "A";
    return per.length
      ? t("sum.limit", { v: per.map((p) => `${p.limit} ${unit}`).join(", ") })
      : t("sum.noLimit");
  }
  if (method === "GetLocalListVersion" && typeof r.listVersion === "number") {
    return r.listVersion < 0
      ? t("sum.noList")
      : t("sum.listVersion", { v: r.listVersion });
  }
  if (method === "GetConfiguration" && Array.isArray(r.configurationKey)) {
    return t("sum.settings", { n: r.configurationKey.length });
  }
  return null;
}

/**
 * Decide which form fields should be seeded from the live charger snapshot.
 * Synchronous — the snapshot is already in the cache by the time a card opens.
 */
function pickSeeds(card, charger, live, t) {
  if (!charger?.online) return { patches: {}, note: null };
  const patches = {};
  let note = null;
  const activeConnector = charger.activeSession?.connectorId ?? 1;

  if (
    PER_PLUG_CARDS.has(card.name) &&
    card.fields.some((f) => f.key === "connectorId")
  )
    patches.connectorId = activeConnector;

  if (card.name === "RemoteStopTransaction" && charger.activeSession?.id)
    patches.transactionId = charger.activeSession.id;

  if (card.name === "ChangeAvailability")
    patches.type =
      charger.status === "Unavailable" ? "Operative" : "Inoperative";

  if (card.name === "SetCurrentLimit") {
    if (live?.limit?.amps != null) {
      patches.limitAmps = Math.max(
        6,
        Math.min(32, Math.round(live.limit.amps)),
      );
      note = {
        tone: "set",
        text: t("ch.limitNow", { a: live.limit.amps }),
      };
    } else if (live?.errors?.some((e) => e.step === "GetCompositeSchedule")) {
      note = { tone: "unknown", text: t("ch.limitUnknown") };
    } else if (live) {
      note = { tone: "none", text: t("ch.limitNone") };
    }
  }

  if (
    card.name === "SendLocalList" &&
    typeof live?.localListVersion === "number"
  ) {
    patches.listVersion = Math.max(0, live.localListVersion + 1);
    note =
      live.localListVersion < 0
        ? { tone: "none", text: t("sum.noList") }
        : {
            tone: "set",
            text: t("sum.listVersion", { v: live.localListVersion }),
          };
  }

  return { patches, note };
}

function Field({ field, value, set }) {
  const { tx } = useI18n();
  const opt = (o) => (field.labels?.[o] ? tx(field.labels[o]) : o);
  return (
    <label className={`field ${field.type === "json" ? "field-wide" : ""}`}>
      <span>{tx(field.label)}</span>
      {field.type === "select" ? (
        <select value={value ?? ""} onChange={(e) => set(e.target.value)}>
          {field.optional ? <option value="">—</option> : null}
          {field.options.map((o) => (
            <option key={o} value={o}>
              {opt(o)}
            </option>
          ))}
        </select>
      ) : field.type === "json" ? (
        <textarea
          rows={8}
          spellCheck={false}
          className="mono-input"
          dir="ltr"
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          type={
            field.type === "number"
              ? "number"
              : field.type === "datetime"
                ? "datetime-local"
                : "text"
          }
          dir={field.type === "text" ? "ltr" : undefined}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </label>
  );
}

function CommandCard({ card, charger, open, onToggle, live }) {
  const { t, tx } = useI18n();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState(() => initialForm(card));
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [formError, setFormError] = useState("");
  const [seedNote, setSeedNote] = useState(null);
  const touchedRef = useRef(new Set());
  const wasOpenRef = useRef(false);

  const main = card.fields.filter((f) => !f.advanced);
  const more = card.fields.filter((f) => f.advanced);

  // Reset the form every time the card goes from closed → open.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      touchedRef.current = new Set();
      setForm(initialForm(card));
      setOut(null);
    } else if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, card.name]);

  // Apply seeds whenever the card is open. Deps cover every source that can
  // change a seed: the card, the charger, the active session, the live cache.
  useEffect(() => {
    if (!open || !charger?.online) return;
    const { patches, note } = pickSeeds(card, charger, live?.data, t);
    if (Object.keys(patches).length) {
      setForm((c) => {
        const next = { ...c };
        for (const [k, v] of Object.entries(patches))
          if (!touchedRef.current.has(k)) next[k] = v;
        return next;
      });
    }
    setSeedNote(note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    card.name,
    charger?.id,
    charger?.online,
    charger?.activeSession?.id,
    charger?.activeSession?.connectorId,
    charger?.status,
    live?.data,
  ]);

  function setField(key, value) {
    touchedRef.current.add(key);
    setForm((c) => ({ ...c, [key]: value }));
  }

  async function send(e) {
    e.preventDefault();
    setFormError("");
    const built = buildParams(card, form);
    if (built.errorKey)
      return setFormError(
        `${tx(built.label)}: ${t(built.errorKey, built.vars)}`,
      );
    const word = card.dangerWord ? card.dangerWord(built.params) : null;
    const danger = card.risk === "dangerous" || Boolean(word);
    if (card.risk !== "safe") {
      const ok = await confirm({
        title: tx(card.title),
        body: danger ? t("dlg.dangerBody") : undefined,
        chargerEffect: tx(card.what),
        moneyEffect: card.money ? tx(card.money) : t("money.none"),
        danger,
        word,
        confirmLabel: t("act.send"),
      });
      if (!ok) return;
    }
    setBusy(true);
    setOut(null);
    const started = Date.now();
    try {
      const result = await adminApi.command(
        charger.id,
        card.name,
        built.params,
      );
      const ex = explainResult(result);
      setOut({
        note: {
          tone: ex.tone,
          text: t(ex.textKey),
          code: ex.code,
          ms: result.ms,
        },
        result,
        summary: summarizeByMethod(card.name, result, t),
        at: new Date().toISOString(),
      });
      if (MUTATING_METHODS.has(card.name)) {
        invalidateChargerLive(charger.id);
        live?.reload?.();
      }
    } catch (err) {
      setOut({
        note: {
          tone: "bad",
          ms: Date.now() - started,
          text: errorText(err, t),
          code: errorCatalogCode(err),
          detail: Array.isArray(err.details)
            ? err.details.map((d) => `${d.field}: ${d.message}`).join(" · ")
            : undefined,
        },
        result: null,
        at: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  }

  const ctx = { chargerId: charger?.id };
  const chargerConfig = live?.data?.config || {};
  return (
    <section className={`cmd-card risk-${card.risk} ${open ? "open" : ""}`}>
      <button
        type="button"
        className="cmd-card-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div>
          <strong>{tx(card.title)}</strong>
          <span>{tx(card.what)}</span>
        </div>
        <Badge tone={RISK_TONE[card.risk]}>
          {card.risk === "dangerous" ? <ShieldAlert size={13} /> : null}
          {t(`risk.${card.risk}`)}
        </Badge>
        <ChevronDown size={18} className={open ? "flip" : ""} />
      </button>
      {open ? (
        <form className="cmd-card-body" onSubmit={send} noValidate>
          <div className="cmd-when">
            <strong>{t("act.when")}</strong> {tx(card.when)}
          </div>

          {seedNote ? (
            <div className={`limit-now limit-${seedNote.tone}`}>
              {seedNote.text}
            </div>
          ) : null}

          {main.length ? (
            <div className="form-grid">
              {card.name === "ChangeConfiguration" ? (
                <ConfigChangeFields
                  form={form}
                  setField={setField}
                  chargerConfig={chargerConfig}
                />
              ) : (
                main.map((f) => (
                  <Field
                    key={f.key}
                    field={f}
                    value={form[f.key]}
                    set={(v) => setField(f.key, v)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="no-fields">{t("act.noFields")}</div>
          )}
          {more.length ? (
            <details className="more">
              <summary>{t("act.more")}</summary>
              <div className="form-grid">
                {more.map((f) => (
                  <Field
                    key={f.key}
                    field={f}
                    value={form[f.key]}
                    set={(v) => setField(f.key, v)}
                  />
                ))}
              </div>
            </details>
          ) : null}
          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="cmd-foot">
            <button
              className="button button-primary"
              type="submit"
              disabled={!charger?.online || busy}
            >
              <Send size={15} />
              {busy ? t("act.sending") : t("act.send")}
            </button>
            {!charger?.online ? (
              <span className="muted">{t("act.offlineNote")}</span>
            ) : null}
          </div>
          {out ? (
            <div className="cmd-result">
              <ResultNote note={out.note} ctx={ctx} />
              {out.summary ? (
                <div className="note note-ok">{out.summary}</div>
              ) : null}
              {out.result ? (
                <TechDetails>
                  <h5>{t("tech.request")}</h5>
                  <pre className="log-payload">{pretty(out.result.sent)}</pre>
                  <h5>
                    {out.result.ok ? t("tech.response") : t("tech.error")}
                  </h5>
                  <pre className="log-payload">
                    {pretty(
                      out.result.ok ? out.result.response : out.result.error,
                    )}
                  </pre>
                  <h5>{t("tech.frames")}</h5>
                  {out.result.frames?.length ? (
                    out.result.frames.map((f, i) => (
                      <div key={i} className="frame-row">
                        <div className="frame-meta">
                          <Badge
                            tone={f.direction === "IN" ? "success" : "accent"}
                          >
                            {f.direction}
                          </Badge>
                          <span className="muted">{formatDate(f.at)}</span>
                        </div>
                        <pre className="log-payload">{f.raw}</pre>
                      </div>
                    ))
                  ) : (
                    <div className="muted">{t("tech.noFrames")}</div>
                  )}
                  <div className="muted">{out.result.ms} ms</div>
                </TechDetails>
              ) : null}
            </div>
          ) : null}
        </form>
      ) : null}
      {dialog}
    </section>
  );
}

function RawCommandSection({ charger, live }) {
  const { t } = useI18n();
  const [method, setMethod] = useState("");
  const [payload, setPayload] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);

  async function send(e) {
    e.preventDefault();
    if (!method) return;

    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setOut({
        note: { tone: "bad", text: t("act.badJson") },
        result: null,
        summary: null,
      });
      return;
    }

    setBusy(true);
    setOut(null);
    const started = Date.now();

    try {
      const res = await adminApi.rawCommand(charger.id, method, parsed);
      const ms = Date.now() - started;

      if (res.ok) {
        const ex = explainResult(res);
        setOut({
          note: { tone: ex.tone, text: t(ex.textKey), code: ex.code, ms },
          result: { ...res, ms },
          summary: summarizeByMethod(method, res, t),
        });
        if (MUTATING_METHODS.has(method)) {
          invalidateChargerLive(charger.id);
          live?.reload?.();
        }
      } else {
        const code = res.error?.code || null;
        setOut({
          note: {
            tone: "bad",
            text: t("res.callError"),
            code: code ? `CALLERROR_${code}` : "CALLERROR_GenericError",
            ms,
          },
          result: { ...res, ms },
          summary: null,
        });
      }
    } catch (err) {
      setOut({
        note: {
          tone: "bad",
          text: errorText(err, t),
          code: errorCatalogCode(err),
          ms: Date.now() - started,
        },
        result: null,
        summary: null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="cmd-card-body" onSubmit={send} noValidate>
      <div className="form-grid">
        <label className="field">
          <span>{t("act.method")}</span>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Reset, TriggerMessage, GetCompositeSchedule…"
            dir="ltr"
            autoComplete="off"
          />
        </label>
        <label className="field field-wide">
          <span>{t("act.payload")}</span>
          <textarea
            rows={5}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"type": "Soft"}'
            className="mono-input"
            dir="ltr"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="cmd-foot">
        <button
          type="submit"
          className="button button-danger"
          disabled={!charger?.online || !method || busy}
        >
          <Send size={15} />
          {busy ? t("act.sending") : t("raw.send")}
        </button>
        {!charger?.online ? (
          <span className="muted">{t("act.offlineNote")}</span>
        ) : null}
      </div>

      {out ? (
        <div className="cmd-result">
          <ResultNote note={out.note} ctx={{ chargerId: charger?.id }} />
          {out.summary ? (
            <div className="note note-ok">{out.summary}</div>
          ) : null}
          {out.result ? (
            <TechDetails>
              <div className="muted">
                {t("res.time", { t: `${out.result.ms} ms` })}
              </div>
              <h5>{out.result.ok ? t("tech.response") : t("tech.error")}</h5>
              <pre className="log-payload">
                {pretty(out.result.ok ? out.result.response : out.result.error)}
              </pre>
            </TechDetails>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export default function ActionsPage() {
  const { t, tx } = useI18n();
  const { chargers } = useOverview();
  const [chargerId, setChargerId] = useState("");
  const [goal, setGoal] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  const charger = chargers.find((c) => c.id === chargerId);
  const live = useChargerLive(chargerId, { online: charger?.online });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMMAND_CARDS.filter(
      (c) =>
        (goal === "all" || c.goal === goal) &&
        (!needle ||
          `${c.name} ${tx(c.title)} ${tx(c.what)}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [goal, q, tx]);

  return (
    <>
      <PageHeader title={t("act.title")} description={t("act.sub")} />
      <div className="help-filters">
        <ChargerSelect
          chargers={chargers}
          value={chargerId}
          onChange={setChargerId}
        />
        <label className="search-box wide">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("act.search")}
            aria-label={t("act.search")}
          />
        </label>
      </div>
      <div className="chips">
        {["all", ...GOALS].map((g) => (
          <button
            key={g}
            type="button"
            className={`chip ${goal === g ? "active" : ""}`}
            onClick={() => setGoal(g)}
          >
            {g === "all" ? t("common.all") : t(`goal.${g}`)}
          </button>
        ))}
      </div>

      {!chargers.length ? <EmptyState title={t("ch.none")} /> : null}

      {chargerId ? (
        <section
          className="cmd-card risk-dangerous"
          style={{ marginBottom: "24px" }}
        >
          <div className="cmd-card-head" style={{ cursor: "default" }}>
            <div>
              <strong>⚠️ {t("raw.title")}</strong>
              <span>{t("raw.body")}</span>
            </div>
          </div>
          <RawCommandSection charger={charger} live={live} />
        </section>
      ) : null}

      <div className="cmd-list">
        {shown.map((c) => (
          <CommandCard
            key={`${c.name}-${chargerId}`}
            card={c}
            charger={charger}
            open={open === c.name}
            onToggle={() => setOpen(open === c.name ? null : c.name)}
            live={live}
          />
        ))}
      </div>
      {!shown.length ? <EmptyState title={t("help.none")} /> : null}
    </>
  );
}
