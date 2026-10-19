import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { adminApi } from "../../api/http";
import { useI18n } from "../../i18n";
import { describeKey, judgeKey } from "../../utils/configInfo";
import { errorText } from "../../utils/plain";
import Badge from "./Badge";
import ConfigValue from "./ConfigValue";
import { HelpLink } from "./HelpPanel";
import Spinner from "./Spinner";

// The few settings that matter every day. One quick read (not the slow full read of the Charger settings page).
const MAIN = ["FreevendEnabled", "AuthorizeRemoteTxRequests", "MeterValueSampleInterval", "HeartbeatInterval", "MeterValuesSampledData", "LocalAuthListEnabled", "NumberOfConnectors"];

export default function MainConfigCard({ charger }) {
  const { t, tx } = useI18n();
  const [state, setState] = useState({ rows: null, loading: false, error: "" });

  const read = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const r = await adminApi.command(charger.id, "GetConfiguration", { key: MAIN });
      const found = new Map((r.response?.configurationKey || []).map((k) => [k.key, k.value]));
      setState({ rows: MAIN.filter((k) => found.has(k)).map((k) => ({ key: k, value: found.get(k) })), loading: false, error: r.ok ? "" : t("res.callError") });
    } catch (e) {
      setState({ rows: null, loading: false, error: errorText(e, t) });
    }
  }, [charger.id, t]);

  useEffect(() => {
    if (charger.online) read();
    // read once when the charger comes online; the button reads again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charger.id, charger.online]);

  return (
    <article className="charger-card main-config">
      <header className="mc-head">
        <div className="charger-icon">
          <SlidersHorizontal size={18} />
        </div>
        <div>
          <strong>{t("mc.title")}</strong>
          <span>{t("mc.sub")}</span>
        </div>
        <button type="button" className="icon-button" onClick={read} disabled={!charger.online || state.loading} aria-label={t("common.refresh")}>
          <RefreshCw size={16} className={state.loading ? "spin" : ""} />
        </button>
      </header>

      {!charger.online ? <div className="note note-warn">{t("mc.offline")}</div> : null}
      {charger.online && state.loading && !state.rows ? (
        <div className="loading-block">
          <Spinner />
        </div>
      ) : null}
      {state.error ? <div className="note note-bad">{state.error}</div> : null}

      {state.rows ? (
        <ul className="mc-list">
          {state.rows.map((r) => {
            const d = describeKey(r.key);
            const bad = judgeKey(r.key, r.value) === "check";
            return (
              <li key={r.key} className={bad ? "mc-bad" : ""}>
                <div className="mc-name">
                  <strong>{tx(d.name)}</strong>
                  <code dir="ltr">{r.key}</code>
                </div>
                <div className="mc-value">
                  <ConfigValue k={r.key} value={r.value} unit={d.unit} bad={bad} />
                </div>
                <div className="mc-status">
                  <Badge tone={bad ? "danger" : "success"}>{bad ? t("cfg.check") : t("cfg.ok")}</Badge>
                  {bad ? <HelpLink code={d.code} ctx={{ chargerId: charger.id }} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Link className="button button-secondary mc-all" to="/admin/charger-settings">
        {t("mc.all")}
      </Link>
    </article>
  );
}
