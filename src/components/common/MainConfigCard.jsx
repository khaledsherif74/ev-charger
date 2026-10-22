import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { useChargerLive } from "../../hooks/useChargerLive";
import { useI18n } from "../../i18n";
import { describeKey, judgeKey } from "../../utils/configInfo";
import Badge from "./Badge";
import ConfigValue from "./ConfigValue";
import { HelpLink } from "./HelpPanel";
import Spinner from "./Spinner";

// The few settings that matter every day. Data comes from the shared live
// cache, so the values are already present when the card first renders.
const MAIN = [
  "FreevendEnabled",
  "AuthorizeRemoteTxRequests",
  "MeterValueSampleInterval",
  "HeartbeatInterval",
  "MeterValuesSampledData",
  "LocalAuthListEnabled",
  "NumberOfConnectors",
];

export default function MainConfigCard({ charger }) {
  const { t, tx } = useI18n();
  const live = useChargerLive(charger.id, { online: charger.online });

  const rows = useMemo(() => {
    const cfg = live.data?.config;
    if (!cfg) return null;
    return MAIN.filter((k) => k in cfg).map((k) => ({
      key: k,
      value: cfg[k],
    }));
  }, [live.data]);

  const read = useCallback(() => {
    live.reload?.();
  }, [live.reload]);

  useEffect(() => {
    if (charger.online) live.reload?.();
    // first open: nothing else needed — useOverview already prefetched
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
        <button
          type="button"
          className="icon-button"
          onClick={read}
          disabled={!charger.online || live.loading}
          aria-label={t("common.refresh")}
        >
          <RefreshCw size={16} className={live.loading ? "spin" : ""} />
        </button>
      </header>

      {!charger.online ? (
        <div className="note note-warn">{t("mc.offline")}</div>
      ) : null}
      {charger.online && live.loading && !rows ? (
        <div className="loading-block">
          <Spinner />
        </div>
      ) : null}
      {live.error ? (
        <div className="note note-bad">{live.error.message}</div>
      ) : null}

      {rows ? (
        <ul className="mc-list">
          {rows.map((r) => {
            const d = describeKey(r.key);
            const bad = judgeKey(r.key, r.value) === "check";
            return (
              <li key={r.key} className={bad ? "mc-bad" : ""}>
                <div className="mc-name">
                  <strong>{tx(d.name)}</strong>
                  <code dir="ltr">{r.key}</code>
                </div>
                <div className="mc-value">
                  <ConfigValue
                    k={r.key}
                    value={r.value}
                    unit={d.unit}
                    bad={bad}
                  />
                </div>
                <div className="mc-status">
                  <Badge tone={bad ? "danger" : "success"}>
                    {bad ? t("cfg.check") : t("cfg.ok")}
                  </Badge>
                  {bad ? (
                    <HelpLink code={d.code} ctx={{ chargerId: charger.id }} />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Link
        className="button button-secondary mc-all"
        to="/admin/charger-settings"
      >
        {t("mc.all")}
      </Link>
    </article>
  );
}
