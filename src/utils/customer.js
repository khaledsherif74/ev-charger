// Customer-side wording helpers (no developer words: no "backend", "endpoint", "server-side").
const BUCKET = {
  UserStop: "you", CancelledByUser: "you", Remote: "you",
  BalanceExhausted: "balance",
  EVIdleTimeout: "full", Local: "full",
  EVDisconnected: "unplugged", UnlockCommand: "unplugged",
  NoStart: "notStarted", RemoteStartRejected: "notStarted", RemoteStartError: "notStarted", StoppedBeforeStart: "notStarted",
};

/** Plain reason a charge ended, as a dictionary key. */
export function whyKey(reason, state) {
  if (!reason) return state === "COMPLETED" ? "u.why.done" : "u.why.none";
  return `u.why.${BUCKET[reason] || "other"}`;
}

/** Plain sentence under a charger on the customer dashboard. */
export function chargerHint(charger, t) {
  if (!charger.online) return t("u.hint.offline");
  if (charger.status === "Preparing") return t("u.hint.ready");
  if (charger.status === "Available") return t("u.hint.plug");
  if (charger.status === "Charging") return t("u.hint.busy");
  if (charger.status === "Faulted") return t("u.hint.faulted");
  return t("u.hint.notNow");
}
