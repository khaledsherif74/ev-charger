import { useI18n } from "../../i18n";

export default function Spinner({ label }) {
  const { t } = useI18n();
  return (
    <span className="spinner-wrap">
      <span className="spinner" />
      <span>{label || t("common.loading")}</span>
    </span>
  );
}
