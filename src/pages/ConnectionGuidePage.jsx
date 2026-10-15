import { useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { entryFor } from "../utils/errorCatalog";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import CopyButton from "../components/common/CopyButton";
import ChargerSelect from "../components/common/ChargerSelect";
import CatalogEntryView from "../components/common/CatalogEntryView";

const TROUBLE = ["Offline", "WrongPassword", "WsRedirect307", "PortForced80", "WrongClock", "NoInternet", "Flapping", "NoHeartbeat"];

function Value({ label, value, note }) {
  return (
    <div className="guide-row">
      <div>
        <strong>{label}</strong>
        {note ? <p>{note}</p> : null}
      </div>
      <code dir="ltr">{value}</code>
      <CopyButton text={value} />
    </div>
  );
}

export default function ConnectionGuidePage() {
  const { t, lang } = useI18n();
  const { overview, chargers } = useOverview(5000); // fast refresh: the owner watches the indicator while rebooting
  const [chargerId, setChargerId] = useState("");
  const [open, setOpen] = useState(null);
  const charger = chargers.find((c) => c.id === chargerId);

  let host = "";
  let secure = true;
  try {
    const u = new URL(overview?.config?.publicUrl || "");
    host = u.host;
    secure = u.protocol === "https:";
  } catch {
    host = "";
  }
  const url = host ? `wss://${host}/ocpp` : "";

  return (
    <>
      <PageHeader title={t("guide.title")} description={t("guide.sub")} />
      <SectionCard title={t("guide.live")}>
        <div className="pad live-box">
          <ChargerSelect chargers={chargers} value={chargerId} onChange={setChargerId} />
          {charger ? (
            <div className={`live ${charger.online ? "on" : "off"}`} role="status">
              {charger.online ? <CircleCheck size={28} /> : <CircleX size={28} />}
              <div>
                <strong>{charger.online ? t("guide.connected") : t("guide.notConnected")}</strong>
                <p>{charger.online ? t("guide.connectedHelp") : t("guide.notConnectedHelp")}</p>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <div style={{ height: 16 }} />
      <SectionCard title={t("guide.values")} subtitle={t("guide.valuesHelp")}>
        {!secure ? <div className="note note-warn">{t("guide.insecure")}</div> : null}
        <div className="guide-list">
          <Value label={t("guide.url")} value={url || t("guide.unknownHost")} note={t("guide.urlHelp")} />
          <Value label={t("guide.port")} value="443" note={t("guide.portHelp")} />
          <Value label={t("guide.protocol")} value="OCPP 1.6J" />
          <Value label={t("guide.id")} value={chargerId || "—"} note={t("guide.idHelp")} />
          <div className="guide-row">
            <div>
              <strong>{t("guide.password")}</strong>
              <p>{t("guide.passwordHelp")}</p>
            </div>
          </div>
        </div>
        <ol className="entry-steps pad">
          {["1", "2", "3", "4", "5"].map((n) => (
            <li key={n}>{t(`guide.step${n}`)}</li>
          ))}
        </ol>
      </SectionCard>

      <div style={{ height: 16 }} />
      <SectionCard title={t("guide.trouble")} subtitle={t("guide.troubleHelp")}>
        <div className="pad">
          {TROUBLE.map((code) => {
            const e = entryFor(code, lang);
            return (
              <div key={code} className={`help-item ${open === code ? "open" : ""}`}>
                <button type="button" className="help-item-head" aria-expanded={open === code} onClick={() => setOpen(open === code ? null : code)}>
                  <span className="help-item-title">{e.title}</span>
                </button>
                {open === code ? <CatalogEntryView entry={e} ctx={{ chargerId }} /> : null}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
