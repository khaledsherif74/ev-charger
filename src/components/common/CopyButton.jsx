import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "../../i18n";

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function CopyButton({ text, label, className = "button button-secondary" }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        }
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />}
      {done ? t("common.copied") : label || t("common.copy")}
    </button>
  );
}
