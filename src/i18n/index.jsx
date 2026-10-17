import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DICT } from "./dict";

const IDX = { en: 0, ar: 1 };

function readLang() {
  try {
    return localStorage.getItem("lang") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function translate(lang, key, vars) {
  const row = DICT[key];
  let s = (row && (row[IDX[lang]] ?? row[0])) ?? key;
  if (vars)
    for (const [k, v] of Object.entries(vars))
      s = s.replaceAll(`{${k}}`, String(v ?? ""));
  return s;
}

export const tStatic = (key, vars) => translate(readLang(), key, vars);

const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const tx = useCallback(
    (obj) => (obj ? (obj[lang] ?? obj.en ?? "") : ""),
    [lang],
  );
  const value = useMemo(
    () => ({
      lang,
      t,
      tx,
      rtl: lang === "ar",
      toggle: () => setLang((l) => (l === "en" ? "ar" : "en")),
    }),
    [lang, t, tx],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
