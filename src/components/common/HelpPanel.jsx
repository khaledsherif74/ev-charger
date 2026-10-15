import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { useI18n } from "../../i18n";
import { entryFor } from "../../utils/errorCatalog";
import CatalogEntryView from "./CatalogEntryView";

// A side panel with the catalog entry for one exact code. Any badge or note can open it with <HelpLink code=... />.
const Ctx = createContext({ open: () => {} });
export const useHelp = () => useContext(Ctx);

export function HelpProvider({ children }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState(null); // { code, ctx }
  const open = useCallback((code, ctx = {}) => setState({ code, ctx }), []);
  const close = useCallback(() => setState(null), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const entry = state ? entryFor(state.code, lang) : null;
  return (
    <Ctx.Provider value={value}>
      {children}
      {state ? (
        <>
          <div className="help-backdrop" onClick={close} />
          <aside className="help-panel" role="dialog" aria-modal="true" aria-label={t("help.what")}>
            <header className="help-panel-head">
              <strong>{t("help.what")}</strong>
              <button type="button" className="icon-button" onClick={close} aria-label={t("dlg.cancel")}>
                <X size={18} />
              </button>
            </header>
            <div className="help-panel-body">
              <CatalogEntryView entry={entry} ctx={state.ctx} />
            </div>
          </aside>
        </>
      ) : null}
    </Ctx.Provider>
  );
}

export function HelpLink({ code, ctx, className = "help-link" }) {
  const { t } = useI18n();
  const { open } = useHelp();
  if (!code) return null;
  return (
    <button type="button" className={className} onClick={() => open(code, ctx)}>
      <CircleHelp size={14} />
      {t("help.what")}
    </button>
  );
}
