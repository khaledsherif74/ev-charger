import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n";

export default function ErrorState({ message, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="error-state">
      <AlertTriangle size={18} />
      <div>
        <strong>{t("common.loadFailed")}</strong>
        <p>{message || t("err.generic")}</p>
      </div>
      {onRetry ? (
        <button className="button button-secondary" onClick={onRetry}>
          {t("common.retry")}
        </button>
      ) : null}
    </div>
  );
}
