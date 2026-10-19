import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT } from "./dict";

// One dictionary: DICT["key"] = [english, arabic]. t(key, vars) replaces {name}, falls back to English, then to the key.
// tx({en, ar}) picks a language from a bilingual text object (used by the error catalog and the command cards).
const IDX = { en: 0, ar: 1 };

export function readLang() {
  try {
    return localStorage.getItem("lang") === "en" ? "en" : "ar"; // Arabic by default; the switcher changes it
  } catch {
    return "ar";
  }
}

function translate(lang, key, vars) {
  const row = DICT[key];
  let s = (row && (row[IDX[lang]] ?? row[0])) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v ?? ""));
  return s;
}

/** For code that is not a React component (for example the API client): uses the saved language. */
export const tStatic = (key, vars) => translate(readLang(), key, vars);

const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* storage blocked: ignore */
    }
  }, [lang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const tx = useCallback((obj) => (obj ? (obj[lang] ?? obj.en ?? "") : ""), [lang]);
  const value = useMemo(
    () => ({ lang, t, tx, rtl: lang === "ar", toggle: () => setLang((l) => (l === "en" ? "ar" : "en")) }),
    [lang, t, tx],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
