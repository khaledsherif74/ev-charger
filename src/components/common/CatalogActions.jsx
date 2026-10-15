import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminApi } from "../../api/http";
import { fetchOverview } from "../../features/admin/adminSlice";
import { fetchAlerts } from "../../features/alerts/alertsSlice";
import { useI18n } from "../../i18n";
import { ACTIONS } from "../../utils/catalogActions";
import { explainResult } from "../../utils/answers";
import { errorCatalogCode, errorText } from "../../utils/plain";
import { useConfirm } from "./ConfirmDialog";
import ResultNote from "./ResultNote";

// What each dashboard button does to the charger and to the customer's money (dictionary keys).
const FX = {
  restart: ["fx.restart", "money.none"],
  enable: ["fx.enable", "money.none"],
  disable: ["fx.disable", "money.none"],
  unlock: ["fx.unlock", "money.none"],
  stopSession: ["fx.stopSession", "money.session"],
  fixFreevend: ["fx.fixFreevend", "money.freevend"],
  fixMeterInterval: ["fx.fixMeterInterval", "money.none"],
  fixHeartbeat: ["fx.fixHeartbeat", "money.none"],
  fixAuthRemote: ["fx.fixAuthRemote", "money.none"],
  clearLimit: ["fx.clearLimit", "money.none"],
  clearCache: ["fx.clearCache", "money.none"],
};

/** One catalog button. Runs the command, explains the answer in plain words, refreshes alerts. */
export function ActionButton({ id, ctx = {}, className = "button button-secondary" }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const chargers = useSelector((s) => s.admin.overview?.chargers) || []; // read only: the page that shows the button keeps it fresh
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const action = ACTIONS[id];
  if (!action) return null;

  if (action.kind === "link")
    return (
      <Link className={className} to={action.to}>
        {t(`ca.${id}`)}
      </Link>
    );

  const charger = chargers.find((c) => c.id === ctx.chargerId);
  const sessionId = ctx.sessionId ?? charger?.activeSession?.id;
  const missing = !ctx.chargerId || (action.needsSession && !sessionId);

  async function run() {
    const [fx, money] = FX[id] || [];
    if (action.risk !== "safe") {
      const ok = await confirm({ title: t(`ca.${id}`), chargerEffect: fx && t(fx), moneyEffect: money && t(money), confirmLabel: t(`ca.${id}`) });
      if (!ok) return;
    }
    setBusy(true);
    setNote(null);
    try {
      const r = await adminApi.command(ctx.chargerId, action.command, action.params({ sessionId }));
      const ex = explainResult(r);
      setNote({ tone: ex.tone, text: t(ex.textKey), code: ex.code });
    } catch (e) {
      setNote({ tone: "bad", text: errorText(e, t), code: errorCatalogCode(e) });
    } finally {
      setBusy(false);
      dispatch(fetchOverview());
      dispatch(fetchAlerts());
    }
  }

  return (
    <div className="action-inline">
      <button type="button" className={className} onClick={run} disabled={busy || missing} title={missing ? t("ca.needCharger") : undefined}>
        {busy ? t("common.loading") : t(`ca.${id}`)}
      </button>
      <ResultNote note={note} ctx={ctx} />
      {dialog}
    </div>
  );
}

export default function CatalogActions({ entry, ctx }) {
  if (!entry.actions.length) return null;
  return (
    <div className="catalog-actions">
      {entry.actions.map((id) => (
        <ActionButton key={id} id={id} ctx={ctx} />
      ))}
    </div>
  );
}
