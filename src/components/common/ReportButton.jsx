import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { adminApi } from "../../api/http";
import { useI18n } from "../../i18n";
import { buildTechReport } from "../../utils/techReport";
import { formatDate } from "../../utils/format";
import { errorText } from "../../utils/plain";
import { copyText } from "./CopyButton";

/** "Copy report": builds the technician report text for one charger, copies it and shows it so it can be pasted. */
export default function ReportButton({ chargerId, className = "button button-secondary" }) {
  const { t } = useI18n();
  const [state, setState] = useState({ busy: false, text: "", copied: false, error: "" });

  async function run() {
    setState({ busy: true, text: "", copied: false, error: "" });
    try {
      const report = await adminApi.chargerReport(chargerId);
      const text = buildTechReport(report, t, formatDate);
      setState({ busy: false, text, copied: await copyText(text), error: "" });
    } catch (e) {
      setState({ busy: false, text: "", copied: false, error: errorText(e, t) });
    }
  }

  if (!chargerId) return null;
  return (
    <div className="report-box">
      <button type="button" className={className} onClick={run} disabled={state.busy}>
        <ClipboardList size={15} />
        {state.busy ? t("common.loading") : t("report.copy")}
      </button>
      {state.error ? <div className="note note-bad">{state.error}</div> : null}
      {state.text ? (
        <>
          <div className={`note ${state.copied ? "note-ok" : "note-warn"}`}>{state.copied ? t("report.copied") : t("report.manual")}</div>
          <textarea className="report-text" readOnly rows={12} value={state.text} dir="auto" onFocus={(e) => e.target.select()} />
        </>
      ) : null}
    </div>
  );
}
