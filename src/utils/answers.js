const OK = new Set([
  "Accepted",
  "Unlocked",
  "Installed",
  "Operative",
  "Scheduled",
]);

export function explainResult(result) {
  if (!result.ok) {
    const code = result.error?.code;
    return {
      tone: "bad",
      textKey: "res.callError",
      code: code ? `CALLERROR_${code}` : "CALLERROR_GenericError",
    };
  }
  const status = result.response?.status;
  if (typeof status !== "string")
    return { tone: "ok", textKey: "res.done", code: null };
  if (status === "RebootRequired")
    return {
      tone: "warn",
      textKey: "res.reboot",
      code: "ANSWER_RebootRequired",
    };
  if (status === "Scheduled")
    return { tone: "ok", textKey: "res.scheduled", code: null };
  if (OK.has(status)) return { tone: "ok", textKey: "res.ok", code: null };
  return { tone: "bad", textKey: "res.refused", code: `ANSWER_${status}` };
}
