/** "5 minutes ago" in the dictionary language. */
export function timeAgo(value, t, now = Date.now()) {
  if (!value) return "—";
  const ms = now - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "—";
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return t("time.now");
  if (min < 60) return t("time.min", { n: min });
  const h = Math.round(min / 60);
  if (h < 48) return t("time.hour", { n: h });
  return t("time.day", { n: Math.round(h / 24) });
}

export function durationText(startedAt, endedAt, t) {
  if (!startedAt) return "—";
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const min = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60000));
  if (min < 60) return t("time.minShort", { n: min });
  return t("time.hm", { h: Math.floor(min / 60), m: min % 60 });
}
