import { useEffect } from "react";
import { useI18n } from "../../i18n";

/** Picks one charger. Selects the first one when nothing is chosen yet. */
export default function ChargerSelect({ chargers, value, onChange, allowAll = false, label }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!allowAll && !value && chargers.length) onChange((chargers.find((c) => c.online) || chargers[0]).id);
  }, [allowAll, value, chargers, onChange]);
  return (
    <label className="field charger-select">
      <span>{label || t("common.charger")}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {allowAll ? <option value="">{t("common.allChargers")}</option> : null}
        {chargers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id}
            {c.online ? "" : ` (${t("status.offline")})`}
          </option>
        ))}
      </select>
    </label>
  );
}
