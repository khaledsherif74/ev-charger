import { useI18n } from "../../i18n";

export default function EmptyState({ title, description = "" }) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="empty-title">{title || t("common.nothing")}</div>
      {description ? <div className="empty-description">{description}</div> : null}
    </div>
  );
}
