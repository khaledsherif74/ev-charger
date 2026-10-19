import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "../i18n";
import { SOURCES, listEntries } from "../utils/errorCatalog";
import useOverview from "../hooks/useOverview";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ChargerSelect from "../components/common/ChargerSelect";
import CatalogEntryView, { SEV_TONE } from "../components/common/CatalogEntryView";
import Badge from "../components/common/Badge";

export default function HelpCenterPage() {
  const { t, lang } = useI18n();
  const { chargers } = useOverview(0);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [sev, setSev] = useState("all");
  const [open, setOpen] = useState(null);
  const [chargerId, setChargerId] = useState("");

  const entries = useMemo(() => listEntries(lang), [lang]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (source === "all" || e.source === source) &&
        (sev === "all" || e.severity === sev) &&
        (!needle || `${e.code} ${e.title} ${e.meaning} ${e.causes.join(" ")} ${e.steps.join(" ")}`.toLowerCase().includes(needle)),
    );
  }, [entries, q, source, sev]);

  return (
    <>
      <PageHeader title={t("help.title")} description={t("help.sub", { n: entries.length })} />
      <div className="help-filters">
        <label className="search-box wide">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("help.search")} aria-label={t("help.search")} />
        </label>
        <label className="field">
          <span>{t("help.severity")}</span>
          <select value={sev} onChange={(e) => setSev(e.target.value)}>
            {["all", "critical", "warning", "info"].map((x) => (
              <option key={x} value={x}>
                {x === "all" ? t("common.all") : t(`sev.${x}`)}
              </option>
            ))}
          </select>
        </label>
        {chargers.length ? <ChargerSelect chargers={chargers} value={chargerId} onChange={setChargerId} label={t("help.applyTo")} /> : null}
      </div>
      <div className="chips">
        {["all", ...SOURCES].map((s) => (
          <button key={s} type="button" className={`chip ${source === s ? "active" : ""}`} onClick={() => setSource(s)}>
            {s === "all" ? t("common.all") : t(`src.${s}`)}
          </button>
        ))}
      </div>
      {shown.length ? (
        SOURCES.filter((s) => shown.some((e) => e.source === s)).map((s) => (
          <section key={s} className="help-group">
            <h2>{t(`src.${s}`)}</h2>
            {shown
              .filter((e) => e.source === s)
              .map((e) => (
                <div key={e.code} className={`help-item ${open === e.code ? "open" : ""}`}>
                  <button type="button" className="help-item-head" aria-expanded={open === e.code} onClick={() => setOpen(open === e.code ? null : e.code)}>
                    <Badge tone={SEV_TONE[e.severity]}>{t(`sev.${e.severity}`)}</Badge>
                    <span className="help-item-title">{e.title}</span>
                    <code className="help-code">{e.code}</code>
                  </button>
                  {open === e.code ? <CatalogEntryView entry={e} ctx={{ chargerId }} /> : null}
                </div>
              ))}
          </section>
        ))
      ) : (
        <EmptyState title={t("help.none")} />
      )}
    </>
  );
}
