export function plainStatus(charger, t) {
  const pick = (key, tone) => ({
    tone,
    label: t(`status.${key}`),
    help: t(`status.${key}Help`),
  });
  if (!charger.online) return pick("offline", "danger");
  switch (charger.status) {
    case "Faulted":
      return pick("faulted", "danger");
    case "Charging":
      return pick("charging", "accent");
    case "Preparing":
      return pick("plugged", "success");
    case "SuspendedEV":
    case "SuspendedEVSE":
      return pick("paused", "warning");
    case "Finishing":
      return pick("finishing", "neutral");
    case "Unavailable":
      return pick("disabled", "neutral");
    case "Reserved":
      return pick("reserved", "neutral");
    default:
      return pick("ready", "success");
  }
}

export function statusWord(status, t) {
  const key = {
    Available: "ready",
    Preparing: "plugged",
    Charging: "charging",
    SuspendedEV: "paused",
    SuspendedEVSE: "paused",
    Finishing: "finishing",
    Unavailable: "disabled",
    Faulted: "faulted",
    Reserved: "reserved",
  }[status];
  return key ? t(`status.${key}`) : status || "";
}

export function statusCatalogCode(charger) {
  if (!charger.online) return "Offline";
  if (charger.errorCode && charger.errorCode !== "NoError")
    return charger.errorCode;
  return [
    "Faulted",
    "Unavailable",
    "SuspendedEV",
    "SuspendedEVSE",
    "Reserved",
  ].includes(charger.status)
    ? charger.status
    : null;
}

const CODES = [
  "CHARGER_OFFLINE",
  "SESSION_ACTIVE",
  "CHARGER_TIMEOUT",
  "UNKNOWN_COMMAND",
  "ADMIN_NOT_CONFIGURED",
  "CHARGER_EXISTS",
  "NETWORK",
  "NOT_PLUGGED",
  "LOW_BALANCE",
  "ALREADY_ACTIVE",
  "START_REJECTED",
  "STOP_REJECTED",
  "NOT_ACTIVE",
];

export function errorCatalogCode(error) {
  if (error?.code && CODES.includes(error.code)) return error.code;
  if (error?.status === 400 && Array.isArray(error?.details))
    return "VALIDATION";
  if (error?.status === 401) return "UNAUTHORIZED";
  return null;
}

export function errorText(error, t) {
  const key = `err.${error?.code}`;
  const text = t(key);
  if (text !== key) return text;
  if (error?.status === 400) return t("err.VALIDATION");
  if (error?.status === 401) return t("err.UNAUTHORIZED");
  return t("err.generic");
}
