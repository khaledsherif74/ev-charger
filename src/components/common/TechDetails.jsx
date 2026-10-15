import { useI18n } from "../../i18n";

/** "Show technical details" expander. Raw JSON, ids and OCPP frames stay left-to-right. */
export default function TechDetails({ children, label }) {
  const { t } = useI18n();
  return (
    <details className="tech">
      <summary>{label || t("tech.show")}</summary>
      <div className="tech-body" dir="ltr">
        {children}
      </div>
    </details>
  );
}

export const pretty = (value) => JSON.stringify(value, null, 2);
