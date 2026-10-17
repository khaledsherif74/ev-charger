import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useI18n } from "../../i18n";

function ConfirmDialog({
  title,
  body,
  chargerEffect,
  moneyEffect,
  danger,
  word,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}) {
  const { t } = useI18n();
  const [typed, setTyped] = useState("");
  const ref = useRef(null);
  const ok = !word || typed.trim().toUpperCase() === word.toUpperCase();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        className={`modal ${danger ? "modal-danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-head">
          {danger ? <ShieldAlert size={22} /> : <TriangleAlert size={22} />}
          <h2>{title}</h2>
        </header>
        <div className="modal-body">
          {body ? <p>{body}</p> : null}
          {chargerEffect ? (
            <div className="effect">
              <strong>{t("dlg.charger")}</strong>
              <p>{chargerEffect}</p>
            </div>
          ) : null}
          {moneyEffect ? (
            <div className="effect">
              <strong>{t("dlg.money")}</strong>
              <p>{moneyEffect}</p>
            </div>
          ) : null}
          {word ? (
            <label className="field">
              <span>{t("dlg.typeWord", { word })}</span>
              <input
                ref={ref}
                dir="ltr"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          ) : null}
        </div>
        <footer className="modal-foot">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {t("dlg.cancel")}
          </button>
          <button
            type="button"
            ref={word ? undefined : ref}
            className={`button ${danger ? "button-danger" : "button-primary"}`}
            onClick={onConfirm}
            disabled={!ok || busy}
          >
            {confirmLabel || t("dlg.confirm")}
          </button>
        </footer>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = useCallback(
    (opts) => new Promise((resolve) => setState({ ...opts, resolve })),
    [],
  );
  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };
  const dialog = state ? (
    <ConfirmDialog
      {...state}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;
  return { confirm, dialog };
}

export default ConfirmDialog;
