import { useI18n } from "../../i18n";
import { BOOL_KEYS, LIST_KEYS, MEASURAND } from "../../utils/configInfo";
import Badge from "./Badge";

/** A configuration value in human form: Yes/No for on-off settings, chips for lists, plain text otherwise. */
export default function ConfigValue({ k, value, unit = "", bad = false }) {
  const { t, tx } = useI18n();
  if (value === null || value === undefined) return <span>—</span>;
  if (value === "") return <span className="muted">{t("cfg.empty")}</span>;
  if (BOOL_KEYS.has(k) && /^(true|false)$/i.test(value)) {
    const yes = value.toLowerCase() === "true";
    return (
      <span className="cv-bool" title={`${k} = ${value}`}>
        <Badge tone={bad ? "danger" : yes ? "success" : "neutral"}>{yes ? t("common.yes") : t("common.no")}</Badge>
      </span>
    );
  }
  if (LIST_KEYS.has(k)) {
    const parts = value.split(",").map((x) => x.trim()).filter(Boolean);
    return (
      <span className="chips-inline">
        {parts.map((p) => (
          <span key={p} className="mini-chip" title={p}>
            {MEASURAND[p] ? tx(MEASURAND[p]) : p}
          </span>
        ))}
      </span>
    );
  }
  return <span dir="ltr">{unit ? `${value} ${unit}` : value}</span>;
}
