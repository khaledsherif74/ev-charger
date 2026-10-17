import { useMemo, useState } from "react";
import { useI18n } from "../../i18n";
import { BOOL_KEYS, WRITABLE_KEYS, writableGroups } from "../../utils/configInfo";

const OTHER = "__other__";

/** "Change one charger setting": pick the setting from a list (plain names) instead of typing its technical name. */
export default function ConfigChangeFields({ form, setField }) {
  const { t, tx } = useI18n();
  const groups = useMemo(() => writableGroups(), []);
  const all = useMemo(() => groups.flatMap((g) => g.keys), [groups]);
  const [pick, setPick] = useState(WRITABLE_KEYS.includes(form.key) ? form.key : form.key ? OTHER : "");
  const info = all.find((k) => k.key === pick);
  const isBool = BOOL_KEYS.has(form.key);

  function choose(value) {
    setPick(value);
    if (value === OTHER || value === "") {
      setField("key", "");
      setField("value", "");
      return;
    }
    const k = all.find((x) => x.key === value);
    setField("key", value);
    setField("value", k?.recommended ?? (BOOL_KEYS.has(value) ? "true" : ""));
  }

  return (
    <>
      <label className="field">
        <span>{t("act.pickKey")}</span>
        <select value={pick} onChange={(e) => choose(e.target.value)}>
          <option value="">{t("act.chooseKey")}</option>
          {groups.map((g) => (
            <optgroup key={g.id} label={tx(g.title)}>
              {g.keys.map((k) => (
                <option key={k.key} value={k.key}>
                  {tx(k.name)} ({k.key})
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER}>{t("act.otherKey")}</option>
        </select>
      </label>
      {pick === OTHER ? (
        <label className="field">
          <span>{t("act.keyName")}</span>
          <input dir="ltr" value={form.key || ""} onChange={(e) => setField("key", e.target.value)} placeholder="VendorSettingName" />
        </label>
      ) : null}
      {pick ? (
        <label className="field">
          <span>{t("act.newValue")}</span>
          {isBool ? (
            <select dir="ltr" value={form.value || "true"} onChange={(e) => setField("value", e.target.value)}>
              <option value="true">true ({t("act.on")})</option>
              <option value="false">false ({t("act.off")})</option>
            </select>
          ) : (
            <input dir="ltr" value={form.value || ""} onChange={(e) => setField("value", e.target.value)} />
          )}
        </label>
      ) : null}
      {info ? (
        <div className="field-wide key-hint">
          <p>{tx(info.what)}</p>
          {info.recommended !== null ? <p>{t("act.recommended", { v: info.recommended })}</p> : null}
        </div>
      ) : null}
    </>
  );
}
