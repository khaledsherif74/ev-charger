import { useI18n } from "../../i18n";

export default function PageHeader({ title, description, actions }) {
  const { t } = useI18n();
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{t("common.eyebrow")}</div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
