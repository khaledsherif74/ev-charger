// Builds the short text the owner pastes into WhatsApp or email for the technician. Pure.
// report = response of GET /api/admin/chargers/:id/report; t = dictionary function; fmt = date formatter.
export function buildTechReport(report, t, fmt = (d) => String(d)) {
  const c = report.charger;
  const dash = (v) => (v === null || v === undefined || v === "" ? "-" : v);
  const lines = [
    t("rep.title"),
    `${t("rep.charger")}: ${c.id}`,
    `${t("rep.model")}: ${dash([report.device.vendor, report.device.model].filter(Boolean).join(" "))}`,
    `${t("rep.firmware")}: ${dash(report.device.firmware)}`,
    `${t("rep.time")}: ${fmt(report.serverTime)}`,
    `${t("rep.connection")}: ${c.online ? t("rep.online") : t("rep.offline")} (${t("rep.lastHeartbeat")}: ${c.lastHeartbeat ? fmt(c.lastHeartbeat) : "-"})`,
    `${t("rep.status")}: ${dash(c.status)}`,
    `${t("rep.errorCode")}: ${dash(c.errorCode)}`,
    `${t("rep.vendorCode")}: ${dash(c.vendorErrorCode)}${c.errorInfo ? ` (${c.errorInfo})` : ""}`,
  ];
  if (report.activeSession) lines.push(`${t("rep.session")}: #${report.activeSession.id} ${report.activeSession.state}`);
  lines.push("", t("rep.events"));
  if (report.events.length) for (const e of report.events) lines.push(`- ${fmt(e.at)} ${e.kind}${e.code ? ` ${e.code}` : ""}${e.detail ? ` ${String(e.detail).slice(0, 120)}` : ""}`);
  else lines.push("-");
  lines.push("", t("rep.lastCommand"));
  const cmd = report.lastCommand;
  lines.push(cmd ? `${fmt(cmd.at)} ${cmd.command}${cmd.params ? ` ${cmd.params}` : ""} -> ${dash(cmd.answer)}` : "-");
  return lines.join("\n");
}
