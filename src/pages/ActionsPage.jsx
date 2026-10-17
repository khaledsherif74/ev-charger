import { useMemo, useState } from "react";
import { ChevronDown, Search, Send, ShieldAlert } from "lucide-react";
import { adminApi } from "../api/http";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { COMMAND_CARDS, GOALS, buildParams, initialForm } from "../utils/commandCards";
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

function summarize(card, result, t) {
  if (!result.ok) return null;
  const r = result.response || {};
  if (card.name === "GetCompositeSchedule" && r.status === "Accepted") {
    const per = r.chargingSchedule?.chargingSchedulePeriod || [];
    const unit = r.chargingSchedule?.chargingRateUnit || "A";
    return per.length ? t("sum.limit", { v: per.map((p) => `${p.limit} ${unit}`).join(", ") }) : t("sum.noLimit");
  }
  if (card.name === "GetLocalListVersion" && typeof r.listVersion === "number") return r.listVersion < 0 ? t("sum.noList") : t("sum.listVersion", { v: r.listVersion });
  if (card.name === "GetConfiguration" && Array.isArray(r.configurationKey)) return t("sum.settings", { n: r.configurationKey.length });
  return null;
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
        <textarea rows={8} spellCheck={false} className="mono-input" dir="ltr" value={value ?? ""} onChange={(e) => set(e.target.value)} />
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"}
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

function CommandCard({ card, charger, open, onToggle }) {
  const { t, tx, lang } = useI18n();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState(() => initialForm(card));
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null); // { note, result, summary, at }
  const [formError, setFormError] = useState("");
  const main = card.fields.filter((f) => !f.advanced);
  const more = card.fields.filter((f) => f.advanced);

  async function send(e) {
    e.preventDefault();
    setFormError("");
    const built = buildParams(card, form);
    if (built.errorKey) return setFormError(`${tx(built.label)}: ${t(built.errorKey, built.vars)}`);
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
      const result = await adminApi.command(charger.id, card.name, built.params);
      const ex = explainResult(result);
      setOut({ note: { tone: ex.tone, text: t(ex.textKey), code: ex.code, ms: result.ms }, result, summary: summarize(card, result, t), at: new Date().toISOString() });
    } catch (err) {
      setOut({ note: { tone: "bad", ms: Date.now() - started, text: errorText(err, t), code: errorCatalogCode(err), detail: Array.isArray(err.details) ? err.details.map((d) => `${d.field}: ${d.message}`).join(" · ") : undefined }, result: null, at: new Date().toISOString() });
    } finally {
      setBusy(false);
    }
  }

  const ctx = { chargerId: charger?.id };
  return (
    <section className={`cmd-card risk-${card.risk} ${open ? "open" : ""}`}>
      <button type="button" className="cmd-card-head" onClick={onToggle} aria-expanded={open}>
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
          {main.length ? (
            <div className="form-grid">
              {card.name === "ChangeConfiguration" ? (
                <ConfigChangeFields form={form} setField={(k, v) => setForm((c) => ({ ...c, [k]: v }))} />
              ) : (
                main.map((f) => <Field key={f.key} field={f} value={form[f.key]} set={(v) => setForm((c) => ({ ...c, [f.key]: v }))} />)
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
                  <Field key={f.key} field={f} value={form[f.key]} set={(v) => setForm((c) => ({ ...c, [f.key]: v }))} />
                ))}
              </div>
            </details>
          ) : null}
          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="cmd-foot">
            <button className="button button-primary" type="submit" disabled={!charger?.online || busy}>
              <Send size={15} />
              {busy ? t("act.sending") : t("act.send")}
            </button>
            {!charger?.online ? <span className="muted">{t("act.offlineNote")}</span> : null}
          </div>
          {out ? (
            <div className="cmd-result">
              <ResultNote note={out.note} ctx={ctx} />
              {out.summary ? <div className="note note-ok">{out.summary}</div> : null}
              {out.result ? (
                <TechDetails>
                  <h5>{t("tech.request")}</h5>
                  <pre className="log-payload">{pretty(out.result.sent)}</pre>
                  <h5>{out.result.ok ? t("tech.response") : t("tech.error")}</h5>
                  <pre className="log-payload">{pretty(out.result.ok ? out.result.response : out.result.error)}</pre>
                  <h5>{t("tech.frames")}</h5>
                  {out.result.frames?.length ? (
                    out.result.frames.map((f, i) => (
                      <div key={i} className="frame-row">
                        <div className="frame-meta">
                          <Badge tone={f.direction === "IN" ? "success" : "accent"}>{f.direction}</Badge>
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

export default function ActionsPage() {
  const { t, tx } = useI18n();
  const { chargers } = useOverview();
  const [chargerId, setChargerId] = useState("");
  const [goal, setGoal] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const charger = chargers.find((c) => c.id === chargerId);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMMAND_CARDS.filter((c) => (goal === "all" || c.goal === goal) && (!needle || `${c.name} ${tx(c.title)} ${tx(c.what)}`.toLowerCase().includes(needle)));
  }, [goal, q, tx]);

  return (
    <>
      <PageHeader title={t("act.title")} description={t("act.sub")} />
      <div className="help-filters">
        <ChargerSelect chargers={chargers} value={chargerId} onChange={setChargerId} />
        <label className="search-box wide">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("act.search")} aria-label={t("act.search")} />
        </label>
      </div>
      <div className="chips">
        {["all", ...GOALS].map((g) => (
          <button key={g} type="button" className={`chip ${goal === g ? "active" : ""}`} onClick={() => setGoal(g)}>
            {g === "all" ? t("common.all") : t(`goal.${g}`)}
          </button>
        ))}
      </div>
      {!chargers.length ? <EmptyState title={t("ch.none")} /> : null}
      <div className="cmd-list">
        {shown.map((c) => (
          <CommandCard key={`${c.name}-${chargerId}`} card={c} charger={charger} open={open === c.name} onToggle={() => setOpen(open === c.name ? null : c.name)} />
        ))}
      </div>
      {!shown.length ? <EmptyState title={t("help.none")} /> : null}
    </>
  );
}
