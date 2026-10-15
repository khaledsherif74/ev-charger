import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, PlusCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { adminApi } from "../api/http";
import { fetchOverview } from "../features/admin/adminSlice";
import useOverview from "../hooks/useOverview";
import { useI18n } from "../i18n";
import { errorCatalogCode, errorText } from "../utils/plain";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import CopyButton from "../components/common/CopyButton";
import ChargerSelect from "../components/common/ChargerSelect";
import { useConfirm } from "../components/common/ConfirmDialog";
import { HelpLink } from "../components/common/HelpPanel";

const ID_RE = /^[A-Za-z0-9._-]{1,48}$/;

function SecretBox({ chargerId, secret }) {
  const { t } = useI18n();
  return (
    <div className="secret-box">
      <div className="note note-warn">{t("add.once")}</div>
      <div className="secret-row">
        <span>{t("add.chargerId")}</span>
        <code dir="ltr">{chargerId}</code>
        <CopyButton text={chargerId} />
      </div>
      <div className="secret-row">
        <span>{t("add.password")}</span>
        <code dir="ltr" className="secret">{secret}</code>
        <CopyButton text={secret} />
      </div>
      <Link className="button button-primary" to="/admin/connection-guide">
        {t("add.next")}
      </Link>
    </div>
  );
}

export default function AddChargerPage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { chargers } = useOverview();
  const { confirm, dialog } = useConfirm();
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [resetId, setResetId] = useState("");
  const [reset, setReset] = useState(null);
  const [resetError, setResetError] = useState(null);

  const valid = ID_RE.test(id);
  async function create(e) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = await adminApi.createCharger(id);
      setCreated({ id: r.charger.id, secret: r.secret });
      setId("");
      dispatch(fetchOverview());
    } catch (err) {
      setError({ text: errorText(err, t), code: errorCatalogCode(err) });
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    const ok = await confirm({
      title: t("add.resetTitle", { id: resetId }),
      body: t("add.resetBody"),
      chargerEffect: t("add.resetCharger"),
      moneyEffect: t("money.none"),
      danger: true,
      word: "RESET",
      confirmLabel: t("add.resetBtn"),
    });
    if (!ok) return;
    setResetError(null);
    setReset(null);
    try {
      const r = await adminApi.resetChargerSecret(resetId);
      setReset({ id: r.chargerId, secret: r.secret });
    } catch (err) {
      setResetError({ text: errorText(err, t), code: errorCatalogCode(err) });
    }
  }

  return (
    <>
      <PageHeader title={t("add.title")} description={t("add.sub")} />
      <SectionCard title={t("add.newTitle")} subtitle={t("add.newHelp")}>
        <form className="pad add-form" onSubmit={create}>
          <label className="field">
            <span>{t("add.chargerId")}</span>
            <input dir="ltr" value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="ABB-STATION-1" maxLength={48} autoComplete="off" />
          </label>
          <p className={`hint ${id && !valid ? "hint-bad" : ""}`}>{t("add.idRule")}</p>
          <button className="button button-primary" disabled={!valid || busy}>
            <PlusCircle size={16} />
            {busy ? t("common.loading") : t("add.create")}
          </button>
          {error ? (
            <div className="note note-bad">
              {error.text} <HelpLink code={error.code} />
            </div>
          ) : null}
        </form>
        {created ? <div className="pad"><SecretBox chargerId={created.id} secret={created.secret} /></div> : null}
      </SectionCard>

      <div style={{ height: 16 }} />
      <SectionCard title={t("add.resetSection")} subtitle={t("add.resetHelp")}>
        <div className="pad add-form">
          <ChargerSelect chargers={chargers} value={resetId} onChange={setResetId} />
          <button type="button" className="button button-danger" disabled={!resetId} onClick={doReset}>
            <KeyRound size={16} />
            {t("add.resetBtn")}
          </button>
          {resetError ? <div className="note note-bad">{resetError.text}</div> : null}
          {reset ? <SecretBox chargerId={reset.id} secret={reset.secret} /> : null}
        </div>
      </SectionCard>
      {dialog}
    </>
  );
}
