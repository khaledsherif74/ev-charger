import { useState } from "react";
import {
  Cpu,
  Heart,
  Info,
  KeyRound,
  Play,
  Plug,
  Power,
  RefreshCw,
  Send,
  Square,
  TriangleAlert,
  Unplug,
  Zap,
  CircleCheckBig,
} from "lucide-react";
import { adminApi } from "../api/http";
import usePaged from "../hooks/usePaged";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { methodTitle } from "../utils/commandCards";
import { statusWord } from "../utils/plain";
import { formatDate } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import ChargerSelect from "../components/common/ChargerSelect";
import TechDetails from "../components/common/TechDetails";
import { HelpLink } from "../components/common/HelpPanel";

const ICONS = {
  power: Power,
  heart: Heart,
  alert: TriangleAlert,
  info: Info,
  key: KeyRound,
  play: Play,
  stop: Square,
  bolt: Zap,
  chip: Cpu,
  send: Send,
  check: CircleCheckBig,
  plug: Plug,
  unplug: Unplug,
};
const RANGES = {
  "1h": 3600e3,
  "24h": 86400e3,
  "7d": 7 * 86400e3,
  "30d": 30 * 86400e3,
};

export default function TimelinePage() {
  const { t, tx } = useI18n();
  const { chargers } = useOverview(0);
  const [chargerId, setChargerId] = useState("");
  const [important, setImportant] = useState(true);
  const [routine, setRoutine] = useState(false);
  const [range, setRange] = useState("24h");

  const list = usePaged(
    async (before) => {
      const from = new Date(Date.now() - RANGES[range]).toISOString();
      const r = await adminApi.timeline({
        chargerId: chargerId || undefined,
        important,
        routine,
        from,
        before: before || undefined,
      });
      return { items: r.items, nextBefore: r.nextBefore };
    },
    [chargerId, important, routine, range],
  );

  const sentence = (i) => {
    const v = { ...i.vars };
    if (v.status !== undefined) v.status = statusWord(v.status, t) || v.status;
    if (i.key === "tl.out" || i.key === "tl.answer" || i.key === "tl.answerOk")
      v.method = methodTitle(v.method, tx);
    if (i.key === "tl.out" && v.detail) v.detail = `(${v.detail})`;
    return t(i.key, v);
  };

  return (
    <>
      <PageHeader
        title={t("tl.title")}
        description={t("tl.sub")}
        actions={
          <button
            type="button"
            className="button button-secondary"
            onClick={list.reload}
            disabled={list.loading}
          >
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />
      <div className="help-filters">
        <ChargerSelect
          chargers={chargers}
          value={chargerId}
          onChange={setChargerId}
          allowAll
        />
        <label className="field">
          <span>{t("tl.show")}</span>
          <select
            value={important ? "1" : "0"}
            onChange={(e) => setImportant(e.target.value === "1")}
          >
            <option value="1">{t("tl.importantOnly")}</option>
            <option value="0">{t("tl.everything")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("tl.range")}</span>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {Object.keys(RANGES).map((r) => (
              <option key={r} value={r}>
                {t(`tl.range.${r}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={routine}
            onChange={(e) => setRoutine(e.target.checked)}
          />
          {t("tl.routine")}
        </label>
      </div>

      <SectionCard>
        {list.loading && !list.items.length ? (
          <div className="loading-block">
            <Spinner />
          </div>
        ) : null}
        {list.error && !list.items.length ? (
          <ErrorState message={list.error.message} onRetry={list.reload} />
        ) : null}
        {list.items.length ? (
          <>
            <ul className="timeline">
              {list.items.map((i) => {
                const Icon = ICONS[i.icon] || Info;
                return (
                  <li
                    key={i.id}
                    className={`tl-row tone-${i.tone || "neutral"}`}
                  >
                    <span className="tl-icon">
                      <Icon size={18} />
                    </span>
                    <div className="tl-main">
                      <div className="tl-text">{sentence(i)}</div>
                      <div className="tl-meta">
                        <span>{formatDate(i.at)}</span>
                        <span dir="ltr">{i.chargerId}</span>
                        {i.code ? (
                          <HelpLink
                            code={i.code}
                            ctx={{ chargerId: i.chargerId }}
                          />
                        ) : null}
                      </div>
                      <TechDetails>
                        <pre className="log-payload">{i.raw}</pre>
                      </TechDetails>
                    </div>
                  </li>
                );
              })}
            </ul>
            {list.next ? (
              <button
                type="button"
                className="button button-secondary load-more"
                onClick={list.loadMore}
                disabled={list.loadingMore}
              >
                {list.loadingMore ? <Spinner /> : t("common.loadMore")}
              </button>
            ) : null}
          </>
        ) : !list.loading && !list.error ? (
          <EmptyState title={t("tl.none")} description={t("tl.noneHelp")} />
        ) : null}
      </SectionCard>
    </>
  );
}
