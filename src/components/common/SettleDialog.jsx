import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { adminApi } from "../../api/http";
import { useI18n } from "../../i18n";
import { errorText } from "../../utils/plain";
import { formatKwh, formatMoneyPiastres } from "../../utils/format";

export default function SettleDialog({
  session,
  pricePerKwhPiastres,
  onClose,
  onDone,
}) {
  const { t } = useI18n();
  const start = session.meterStartWh;
  const [value, setValue] = useState(start == null ? "" : String(start));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const n = Number(value);
  const valid =
    value !== "" &&
    Number.isInteger(n) &&
    start != null &&
    n >= start &&
    n - start <= 500000;
  const energy = valid ? n - start : 0;
  const cost =
    valid && pricePerKwhPiastres
      ? Math.round((energy * pricePerKwhPiastres) / 1000)
      : 0;
  const hint =
    value === ""
      ? ""
      : !Number.isInteger(n)
        ? t("settle.int")
        : n < start
          ? t("settle.low", { start })
          : n - start > 500000
            ? t("settle.high")
            : "";

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await adminApi.settle(session.id, n);
      onDone();
    } catch (e) {
      setError(
        t(`err.${e.code}`) !== `err.${e.code}`
          ? t(`err.${e.code}`)
          : errorText(e, t),
      );
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="modal modal-danger"
        role="dialog"
        aria-modal="true"
        aria-label={t("settle.title")}
      >
        <header className="modal-head">
          <ShieldAlert size={22} />
          <h2>{t("settle.title", { n: session.id })}</h2>
        </header>
        <div className="modal-body">
          <p>{t("settle.explain")}</p>
          <div className="effect">
            <strong>{session.userEmail}</strong>
            <p dir="ltr">
              {t("common.charger")} {session.chargerId} ·{" "}
              {t("settle.startMeter")}: {start ?? "—"} Wh
            </p>
          </div>
          <label className="field">
            <span>{t("settle.finalMeter")}</span>
            <input
              type="number"
              dir="ltr"
              min={start ?? 0}
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </label>
          {hint ? <div className="form-error">{hint}</div> : null}
          <div className="effect">
            <strong>{t("settle.result")}</strong>
            <p>
              {valid
                ? t("settle.resultLine", {
                    kwh: formatKwh(energy),
                    cost: formatMoneyPiastres(cost),
                  })
                : "—"}
            </p>
          </div>
          <div className="effect">
            <strong>{t("dlg.money")}</strong>
            <p>{t("settle.money", { cost: formatMoneyPiastres(cost) })}</p>
          </div>
          <div className="effect">
            <strong>{t("dlg.charger")}</strong>
            <p>{t("settle.charger")}</p>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
        </div>
        <footer className="modal-foot">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            {t("dlg.cancel")}
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={submit}
            disabled={!valid || busy}
          >
            {busy ? t("common.loading") : t("settle.confirm")}
          </button>
        </footer>
      </div>
    </div>
  );
}
