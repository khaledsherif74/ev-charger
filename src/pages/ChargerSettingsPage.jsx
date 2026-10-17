import { useEffect, useMemo, useState } from "react";
import { Gauge, RefreshCw, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { adminApi } from "../api/http";
import { fetchChargerConfig } from "../features/admin/adminSlice";
import { fetchAlerts } from "../features/alerts/alertsSlice";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { groupConfig } from "../utils/configInfo";
import { errorCatalogCode, errorText } from "../utils/plain";
import { explainResult } from "../utils/answers";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import ChargerSelect from "../components/common/ChargerSelect";
import ResultNote from "../components/common/ResultNote";
import { useConfirm } from "../components/common/ConfirmDialog";
import { HelpLink } from "../components/common/HelpPanel";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reads the limit the charger really applies (GetCompositeSchedule in amps), whole charger and plug 1.
function CurrentLimitCard({ chargerId }) {
  const { t } = useI18n();
  const [state, setState] = useState({ status: "idle", rows: [], error: null });

  async function read() {
    setState({ status: "loading", rows: [], error: null });
    const rows = [];
    try {
      for (const connectorId of [0, 1]) {
        const result = await adminApi.command(chargerId, "GetCompositeSchedule", { connectorId, duration: 3600, chargingRateUnit: "A" });
        rows.push({ connectorId, result });
        setState({ status: "loading", rows: [...rows], error: null });
        if (connectorId === 0) await sleep(1200); // ABB: about 1 second between commands
      }
      setState({ status: "done", rows, error: null });
    } catch (e) {
      setState({ status: "failed", rows, error: errorText(e, t) });
    }
  }

  return (
    <div className="current-card">
      <div className="current-card-head">
        <div>
          <h3>
            <Gauge size={16} /> {t("cfg.limitTitle")}
          </h3>
          <p>{t("cfg.limitHelp")}</p>
        </div>
        <button className="button button-secondary" onClick={read} disabled={state.status === "loading"}>
          <RefreshCw size={15} className={state.status === "loading" ? "spin" : ""} />
          {t("cfg.limitRead")}
        </button>
      </div>
      {state.error ? <div className="form-error">{state.error}</div> : null}
      {state.rows.length ? (
        <div className="current-grid">
          {state.rows.map(({ connectorId, result }) => {
            const periods = result.response?.chargingSchedule?.chargingSchedulePeriod || [];
            const unit = result.response?.chargingSchedule?.chargingRateUnit || "A";
            const low = periods.some((p) => p.limit < 10);
            return (
              <div key={connectorId} className="current-item">
                <span>{connectorId === 0 ? t("cfg.wholeCharger") : t("cfg.plug", { n: connectorId })}</span>
                {!result.ok ? <Badge tone="danger">{t("cfg.limitError")}</Badge> : periods.length ? <Badge tone={low ? "warning" : "success"}>{low ? t("cfg.limitLow") : t("cfg.limitSet")}</Badge> : <Badge tone="neutral">{t("cfg.limitNone")}</Badge>}
                <strong>{periods.length ? periods.map((p) => `${p.limit} ${unit}`).join(" · ") : t("cfg.limitNoneHelp")}</strong>
                {low ? <HelpLink code="CURRENT_LIMIT_LOW" ctx={{ chargerId }} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ChargerSettingsPage() {
  const { t, tx } = useI18n();
  const dispatch = useDispatch();
  const { chargers } = useOverview();
  const [chargerId, setChargerId] = useState("");
  const [query, setQuery] = useState("");
  const [fixing, setFixing] = useState("");
  const [note, setNote] = useState(null);
  const { confirm, dialog } = useConfirm();
  const charger = chargers.find((c) => c.id === chargerId);
  const data = useSelector((s) => (chargerId ? s.admin.configByCharger[chargerId] : null));
  const status = useSelector((s) => (chargerId ? s.admin.configStatusByCharger[chargerId] : "idle"));
  const error = useSelector((s) => (chargerId ? s.admin.configErrorByCharger[chargerId] : null));
  const groups = useMemo(() => groupConfig(data?.configurationKey, query, tx), [data, query, tx]);
  const checkCount = groups.reduce((n, g) => n + g.entries.filter((e) => e.status === "check").length, 0);
  const loading = status === "loading";

  useEffect(() => {
    if (chargerId && charger?.online && !data && status !== "loading") dispatch(fetchChargerConfig(chargerId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargerId, charger?.online]);

  async function fix(entry) {
    const value = entry.info.recommended;
    const ok = await confirm({
      title: t("cfg.fixTitle", { name: tx(entry.info.name) }),
      body: t("cfg.fixBody", { key: entry.key, from: entry.value ?? "—", to: value }),
      chargerEffect: t("fx.setting", { key: entry.key, value }),
      moneyEffect: entry.key === "FreevendEnabled" ? t("money.freevend") : t("money.none"),
      confirmLabel: t("cfg.fix"),
    });
    if (!ok) return;
    setFixing(entry.key);
    setNote(null);
    try {
      const r = await adminApi.command(chargerId, "ChangeConfiguration", { key: entry.key, value });
      const ex = explainResult(r);
      setNote({ tone: ex.tone, text: t(ex.textKey), code: ex.code, ms: r.ms });
      dispatch(fetchChargerConfig(chargerId));
      dispatch(fetchAlerts());
    } catch (e) {
      setNote({ tone: "bad", text: errorText(e, t), code: errorCatalogCode(e) });
    } finally {
      setFixing("");
    }
  }

  return (
    <>
      <PageHeader title={t("cfg.title")} description={t("cfg.sub")} />
      <div className="help-filters">
        <ChargerSelect chargers={chargers} value={chargerId} onChange={setChargerId} />
        {chargerId ? (
          <button className="button button-secondary" onClick={() => dispatch(fetchChargerConfig(chargerId))} disabled={!charger?.online || loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            {t("cfg.read")}
          </button>
        ) : null}
      </div>
      {charger && !charger.online ? <EmptyState title={t("cfg.offline")} description={t("cfg.offlineHelp")} /> : null}
      {charger?.online ? (
        <SectionCard title={t("cfg.settings")}>
          <CurrentLimitCard key={chargerId} chargerId={chargerId} />
          <ResultNote note={note} ctx={{ chargerId }} />
          {loading && !data ? (
            <div className="loading-block">
              <Spinner label={t("cfg.reading")} />
            </div>
          ) : null}
          {error ? <ErrorState message={error} onRetry={() => dispatch(fetchChargerConfig(chargerId))} /> : null}
          {data ? (
            <>
              <div className="config-toolbar">
                <div className="config-summary">
                  <div>
                    <span>{t("cfg.read")}</span>
                    <strong>{data.configurationKey.length}</strong>
                  </div>
                  <div>
                    <span>{t("cfg.needCheck")}</span>
                    <strong className={checkCount ? "money-neg" : ""}>{checkCount}</strong>
                  </div>
                </div>
                <label className="search-box">
                  <Search size={15} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("cfg.search")} aria-label={t("cfg.search")} />
                </label>
              </div>
              {groups.map((g) => (
                <div className="config-group" key={g.id}>
                  <div className="config-group-head">
                    <h3>{tx(g.title)}</h3>
                  </div>
                  <div className="table-shell table-fit">
                    <table className="data-table compact config-table">
                      <thead>
                        <tr>
                          <th>{t("cfg.col.setting")}</th>
                          <th>{t("cfg.col.value")}</th>
                          <th>{t("cfg.col.what")}</th>
                          <th>{t("cfg.col.recommended")}</th>
                          <th>{t("common.status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.entries.map((e) => (
                          <tr key={e.key} className={e.status === "check" ? "row-review" : ""}>
                            <td data-label={t("cfg.col.setting")}>
                              <strong>{tx(e.info.name)}</strong>
                              <br />
                              <code className="key-code" dir="ltr">{e.key}</code>
                            </td>
                            <td dir="ltr" data-label={t("cfg.col.value")}>{e.value === null ? "—" : e.value === "" ? t("cfg.empty") : `${e.value}${e.info.unit ? ` ${e.info.unit}` : ""}`}</td>
                            <td className="muted" data-label={t("cfg.col.what")}>{tx(e.info.what) || "—"}</td>
                            <td dir="ltr" data-label={t("cfg.col.recommended")}>{e.info.recommended ?? "—"}</td>
                            <td data-label={t("common.status")}>
                              {e.status === "ok" ? (
                                <Badge tone="success">{t("cfg.ok")}</Badge>
                              ) : (
                                <>
                                  <Badge tone="danger">{t("cfg.check")}</Badge>
                                  {!e.readonly && e.info.recommended !== null ? (
                                    <button type="button" className="button button-primary" disabled={fixing === e.key} onClick={() => fix(e)}>
                                      {fixing === e.key ? t("common.loading") : t("cfg.fix")}
                                    </button>
                                  ) : null}
                                  <HelpLink code={e.info.code} ctx={{ chargerId }} />
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {data.unknownKey?.length ? (
                <details className="more pad">
                  <summary>{t("cfg.unsupported", { n: data.unknownKey.length })}</summary>
                  <div className="chip-list" dir="ltr">
                    {data.unknownKey.map((k) => (
                      <code key={k} className="key-code">{k}</code>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          ) : null}
        </SectionCard>
      ) : null}
      {dialog}
    </>
  );
}
